"""Tinh trong so skin D01 (numpy thuan, khong can bpy). Khoi diem tu dong theo vung giai phau, sau do chuan hoa top-4.

Moi dinh duoc phan vung (lop) theo thanh phan lien thong (sau khi han dinh trung vi tri o duong noi UV) + mau + hinh hoc:
  helmet, horn -> helmet 1.0 ; brick (gach tren tui) -> sack 1.0 ; eye -> head 1.0
  loin (khoi): that lung (belt) -> pelvis/spine ; manh truoc -> pelvis -> loincloth_front ; manh sau -> pelvis
  main: sack (vai tui) / strap (day dai, tren nguc) / skin (than, tay, chan, dau) / ear
Trong so skin = nghich dao khoang cach den doan xuong (tru ban kinh), cong cong (gate) theo vung va ben, lam min Laplace, cat top-4.
"""
import numpy as np

import d01_rig_def as D

NAMES = None  # bone deform, thu tu cot


def weld(co, eps=2e-6):
    key = np.round(co / eps).astype(np.int64)
    _, first, inv = np.unique(key, axis=0, return_index=True, return_inverse=True)
    return inv.ravel(), first


def seg_dist(P, a, b):
    a = np.asarray(a); b = np.asarray(b)
    ab = b - a
    t = np.clip(((P - a) @ ab) / (ab @ ab), 0.0, 1.0)
    q = a + t[:, None] * ab
    return np.linalg.norm(P - q, axis=1), t


def adjacency(tris_w, n):
    e = np.concatenate([tris_w[:, [0, 1]], tris_w[:, [1, 2]], tris_w[:, [2, 0]]])
    e = np.sort(e, axis=1)
    e = np.unique(e, axis=0)
    e = e[e[:, 0] != e[:, 1]]
    return e


def components(edges, n):
    par = np.arange(n)

    def f(a):
        while par[a] != a:
            par[a] = par[par[a]]
            a = par[a]
        return a
    for a, b in edges:
        ra, rb = f(a), f(b)
        if ra != rb:
            par[rb] = ra
    return np.array([f(i) for i in range(n)])


def smoothstep(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


# ban kinh uoc luong (m) va cong z cho tung bone skin than
RADIUS = {"pelvis": 0.050, "spine_01": 0.050, "spine_02": 0.050, "chest": 0.052, "neck": 0.020, "head": 0.050,
          "UpperArm": 0.016, "ForeArm": 0.012, "Hand": 0.012,
          "Thigh": 0.022, "Calf": 0.017, "Foot": 0.020, "Toe": 0.012}


def base(name):
    return name[2:] if name[:2] in ("L_", "R_") else name


def compute(co, col, tris, prm=None):
    """co (n,3) float, col (n,3), tris (m,3) chi so dinh goc (chua han). Tra ve dict: W (n,nb) trong so, names, cls (n,) nhan lop."""
    import os as _os
    prm = {"p": 3.0, "smooth_iters": 16, "smooth_lambda": 0.5, "prune": 0.02, "sack_head_cap": float(_os.environ.get("D01_SACK_HEAD_CAP", "1.0")), **(prm or {})}
    B = D.build()
    names = D.deform_names(B)
    bn = D.by_name(B)
    nb = len(names)
    idx = {n: i for i, n in enumerate(names)}
    inv, first = weld(co)
    nw = inv.max() + 1
    P = np.zeros((nw, 3)); C = np.zeros((nw, 3)); cnt = np.bincount(inv, minlength=nw)
    for k in range(3):
        P[:, k] = np.bincount(inv, weights=co[:, k], minlength=nw) / cnt
        C[:, k] = np.bincount(inv, weights=col[:, k], minlength=nw) / cnt
    tw = inv[tris]
    E = adjacency(tw, nw)
    comp = components(E, nw)
    ids, sizes = np.unique(comp, return_counts=True)
    main_id = ids[sizes.argmax()]
    cls = np.array(["main"] * nw, dtype=object)
    for cid, sz in zip(ids, sizes):
        if cid == main_id:
            continue
        m = comp == cid
        c = P[m].mean(0); lo = P[m].min(0)
        if sz > 300 and lo[2] > 0.37:
            cls[m] = "helmet"
        elif sz > 300 and c[2] < 0.25:
            cls[m] = "loin"
        elif sz < 40 and c[1] < -0.08:
            cls[m] = "eye"
        elif c[1] < -0.04 and c[2] > 0.40 and sz < 100 and C[m].mean(0)[0] / C[m].mean(0)[1] < 1.4:
            cls[m] = "horn"
        else:
            cls[m] = "brick"
    rg = C[:, 0] / np.maximum(C[:, 1], 1e-3)
    cloth = (rg < 1.55)
    mainm = cls == "main"
    # tui: vai xam-olive o phia sau / tren lung ; day dai: vai o phia truoc
    sack_geo = mainm & (P[:, 1] > 0.07) & (P[:, 2] > 0.2)  # sau lung hon mat sau than: chi co tui
    cls[mainm & (cloth & (P[:, 1] > 0.0) & (P[:, 2] > 0.2) | sack_geo)] = "sack"
    cls[mainm & cloth & (P[:, 1] <= 0.0) & (P[:, 2] > 0.2) & (P[:, 2] < 0.36)] = "strap"
    # lam min nhan tui/than bang da so lang gieng (mau texture co dinh sai le)
    nbrs0 = [[] for _ in range(nw)]
    for a_, b_ in E:
        nbrs0[a_].append(b_); nbrs0[b_].append(a_)
    for _ in range(3):
        chg = []
        for v in np.nonzero((cls == "main") | (cls == "sack"))[0]:
            nb_ = [u for u in nbrs0[v] if cls[u] in ("main", "sack")]
            if len(nb_) < 3:
                continue
            frac = sum(cls[u] == "sack" for u in nb_) / len(nb_)
            if cls[v] == "main" and frac > 0.6 and P[v, 2] > 0.2 and P[v, 1] > 0.0:
                chg.append((v, "sack"))
            elif cls[v] == "sack" and frac < 0.25:
                chg.append((v, "main"))
        for v, c_ in chg:
            cls[v] = c_
    skinm = cls == "main"
    # tai: dinh da gan duong xuong tai (moi ben)
    ear_cand = np.zeros(nw, bool)
    for side in ("L", "R"):
        e_ = bn[f"{side}_ear"]
        de, _t = seg_dist(P, e_["head"], e_["tail"])
        out_skull = ((P[:, 0] / 0.050) ** 2 + ((P[:, 1] + 0.045) / 0.062) ** 2 + ((P[:, 2] - 0.38) / 0.050) ** 2) > 1.3  # ngoai so (tai la tam mong nhoi ra khoi dau)
        ear_cand |= skinm & (de < 0.022) & (P[:, 2] > 0.358) & (P[:, 2] < 0.43) & (P[:, 1] < 0.02) & (np.abs(P[:, 0]) > 0.05) & out_skull
    cls[ear_cand] = "ear"
    # khoi: that lung / manh truoc / manh sau
    loin = cls == "loin"
    belt = loin & (P[:, 2] >= 0.205)
    flap_front = loin & (P[:, 2] < 0.205) & (P[:, 1] <= 0.02)
    flap_back = loin & (P[:, 2] < 0.205) & (P[:, 1] > 0.02)
    cls[belt] = "belt"
    cls[flap_front] = "flap_front"
    cls[flap_back] = "flap_back"

    W = np.zeros((nw, nb))
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    LMX = D.LEG_MX

    # --- cong cho tung bone (mat na theo vung va ben)
    def gate(name):
        b = base(name)
        s = 0 if name[:2] not in ("L_", "R_") else (1 if name[0] == "L" else -1)
        if b == "pelvis":
            return z < 0.27
        if b == "spine_01":
            return (z > 0.17) & (z < 0.31)
        if b == "spine_02":
            return (z > 0.21) & (z < 0.36)
        if b == "chest":
            return (z > 0.26) & (z < 0.40)
        if b == "neck":
            return (z > 0.32) & (z < 0.42)
        if b == "head":
            return z > 0.33
        if b == "UpperArm":
            return (s * x > 0.02) & (z > 0.26)
        if b == "ForeArm":
            return (s * x > 0.09) & (z > 0.26)
        if b == "Hand":
            return (s * x > 0.20) & (z > 0.26)
        if b == "Thigh":
            return (s * (x - LMX) > -0.004) & (z < 0.215)
        if b == "Calf":
            return (s * (x - LMX) > -0.004) & (z < 0.16) & (z > 0.03)
        if b == "Foot":
            return (s * (x - LMX) > -0.004) & (z < 0.08)
        if b == "Toe":
            return (s * (x - LMX) > -0.004) & (z < 0.04) & (y < 0.005)
        return np.zeros(nw, bool)

    skin_bones = [n for n in names if base(n) in RADIUS]
    E_ = np.full((nw, nb), np.inf)
    RAWE = np.full((nw, nb), np.inf)
    FALLBACK = []
    for n in skin_bones:
        a, b_ = bn[n]["head"], bn[n]["tail"]
        d, t = seg_dist(P, a, b_)
        e = np.maximum(d - RADIUS[base(n)], 0.003)
        RAWE[:, idx[n]] = e
        e = np.where(gate(n), e, np.inf)
        E_[:, idx[n]] = e

    def solve(mask, allow=None, p=prm["p"]):
        """w ~ e^-p chi tren cac bone cho phep."""
        sub = E_[mask].copy()
        if allow is not None:
            col_ok = np.zeros(nb, bool)
            for n in allow:
                col_ok[idx[n]] = True
            sub[:, ~col_ok] = np.inf
        w = np.where(np.isfinite(sub), sub ** -p, 0.0)
        s = w.sum(1, keepdims=True)
        bad = (s[:, 0] == 0)
        if bad.any():  # khong bone nao qua cong: dung khoang cach tho (khong cong) toi cac bone cho phep
            FALLBACK.append(int(bad.sum()))
            sub2 = RAWE[mask][bad]
            cols = [idx[n] for n in (allow or names)]
            ww = np.zeros_like(sub2)
            ww[:, cols] = sub2[:, cols] ** -p
            w[bad] = ww
            s = w.sum(1, keepdims=True)
        return w / s

    body_core = ["pelvis", "spine_01", "spine_02", "chest", "neck", "head", "L_UpperArm", "R_UpperArm", "L_ForeArm", "R_ForeArm",
                 "L_Hand", "R_Hand", "L_Thigh", "R_Thigh", "L_Calf", "R_Calf", "L_Foot", "R_Foot", "L_Toe", "R_Toe"]
    m = (cls == "main") | (cls == "ear")
    W[m] = solve(m, allow=body_core)
    m = cls == "strap"
    W[m] = solve(m, allow=["pelvis", "spine_01", "spine_02", "chest", "neck"])
    m = cls == "belt"
    W[m] = solve(m, allow=["pelvis", "spine_01", "spine_02"])
    # --- lam min Laplace trong nhom than (khong lan sang lop cung)
    smooth_set = (cls == "main") | (cls == "ear") | (cls == "strap") | (cls == "belt")
    ea = E[:, 0]; eb = E[:, 1]
    ok = smooth_set[ea] & smooth_set[eb]
    # khong lam min qua ranh gioi trai/phai (chan) va giua cac lop khac nhau: chi canh cung lop
    ok &= (cls[ea] == cls[eb]) | ((cls[ea] == "main") & (cls[eb] == "ear")) | ((cls[ea] == "ear") & (cls[eb] == "main"))
    ea, eb = ea[ok], eb[ok]
    legband = z < 0.2
    xs = np.where(x > LMX, 1, -1)
    ok2 = ~(legband[ea] & legband[eb] & (xs[ea] != xs[eb]))  # khong noi hai chan qua khe
    ea, eb = ea[ok2], eb[ok2]
    deg = np.bincount(np.concatenate([ea, eb]), minlength=nw).astype(float)
    for _ in range(prm["smooth_iters"]):
        acc = np.zeros_like(W)
        np.add.at(acc, ea, W[eb])
        np.add.at(acc, eb, W[ea])
        has = deg > 0
        avg = np.where(has[:, None], acc / np.maximum(deg, 1)[:, None], W)
        W = np.where((smooth_set & has)[:, None], (1 - prm["smooth_lambda"]) * W + prm["smooth_lambda"] * avg, W)
    # --- chuoi tay thang doc +-X: chuyen tiep khuyu (rong 4 cm) va co tay (rong 2,4 cm) theo toa do doc de ban tay cung, khop sach
    arm_geo = D.fitted_landmarks()[0]
    el_x, wr_x = arm_geo["elbow"][0], arm_geo["wrist"][0]
    for side, sg in (("L", 1), ("R", -1)):
        ax = sg * x
        arm_m = (cls == "main") & (ax > 0.10) & (z > 0.27) & (z < 0.40) & (np.abs(y) < 0.14)
        te = smoothstep((ax[arm_m] - (el_x - 0.02)) / 0.04)
        th = smoothstep((ax[arm_m] - (wr_x - 0.012)) / 0.024)
        Wa = np.zeros((arm_m.sum(), nb))
        Wa[:, idx[f"{side}_Hand"]] = th
        Wa[:, idx[f"{side}_ForeArm"]] = (1 - th) * te
        Wa[:, idx[f"{side}_UpperArm"]] = (1 - th) * (1 - te)
        bl = smoothstep((ax[arm_m] - 0.10) / 0.03)[:, None]
        W[arm_m] = (1 - bl) * W[arm_m] + bl * Wa
    # --- tai: pha dau/tai theo toa do doc theo xuong tai
    for side, s in (("L", 1), ("R", -1)):
        m = (cls == "ear") & (s * x > 0)
        if m.any():
            e = bn[f"{side}_ear"]
            d, t = seg_dist(P[m], e["head"], e["tail"])
            we = smoothstep((t - 0.05) / 0.45)
            Wm = W[m] * 0.0
            Wm[:, idx["head"]] = 1 - we
            Wm[:, idx[f"{side}_ear"]] = we
            W[m] = Wm
    # --- rang: helmet, horn, eye, brick
    W[cls == "helmet", idx["helmet"]] = 1
    W[cls == "horn", idx["helmet"]] = 1
    W[cls == "eye", idx["head"]] = 1
    W[cls == "brick", idx["sack"]] = 1
    # --- tui (vai): sack, tron voi trong so thit/day dai lan can
    sk = cls == "sack"
    rigid_free = ~np.isin(cls, ["sack", "brick", "helmet", "horn", "eye", "flap_front", "flap_back"])
    # BFS nhieu nguon tu cac dinh khong phai tui (than/day dai)
    src = np.where(~sk & np.isin(cls, ["main", "strap", "ear", "belt"]))[0]
    hop = np.full(nw, 99); near = np.full(nw, -1)
    hop[src] = 0; near[src] = src
    nbrs = [[] for _ in range(nw)]
    for a_, b_ in E:
        nbrs[a_].append(b_); nbrs[b_].append(a_)
    frontier = list(src)
    for h in range(1, 9):
        nxt = []
        for v in frontier:
            for u in nbrs[v]:
                if hop[u] > h and sk[u]:
                    hop[u] = h; near[u] = near[v]; nxt.append(u)
        frontier = nxt
    alpha = np.where(sk, np.clip(1 - (hop - 0.0) / 8.0, 0, 1), 0)
    sack_w = np.zeros((nw, nb)); sack_w[:, idx["sack"]] = 1
    torso_cols = [idx[n_] for n_ in ("pelvis", "spine_01", "spine_02", "chest", "neck", "head")]
    torso_only = np.zeros((nw, nb)); torso_only[:, torso_cols] = W[:, torso_cols]
    ts = torso_only.sum(1, keepdims=True)
    torso_only = np.where(ts > 1e-9, torso_only / np.maximum(ts, 1e-9), 0.0)
    cap = prm.get("sack_head_cap", 1.0)  # gioi han anh huong cua dau len vai tui (tranh keo ma 'man' vai khi ngua dau)
    hc = idx["head"]
    over = torso_only[:, hc] > cap
    excess = np.where(over, torso_only[:, hc] - cap, 0.0)
    torso_only[:, hc] -= excess
    torso_only[:, idx["chest"]] += excess
    nochest = (ts[:, 0] <= 1e-9)
    torso_only[nochest, idx["chest"]] = 1.0
    for v in np.where(sk)[0]:
        if near[v] >= 0:
            W[v] = (1 - alpha[v]) * sack_w[v] + alpha[v] * torso_only[near[v]]
        else:
            W[v] = sack_w[v]
    # lam min them trong so vai tui (chi cap nhat dinh tui; lang gieng ke ca than de noi lien lac)
    sk_idx = np.nonzero(sk)[0]
    ea2 = np.concatenate([E[:, 0], E[:, 1]]); eb2 = np.concatenate([E[:, 1], E[:, 0]])
    keep = sk[ea2] & np.isin(cls[eb2], ["sack", "main", "strap", "belt", "ear"])
    ea2, eb2 = ea2[keep], eb2[keep]
    deg2 = np.bincount(ea2, minlength=nw).astype(float)
    for _ in range(6):
        acc = np.zeros_like(W)
        np.add.at(acc, ea2, W[eb2])
        avg = acc / np.maximum(deg2, 1)[:, None]
        W = np.where((sk & (deg2 > 0))[:, None], 0.5 * W + 0.5 * avg, W)
    # --- khoi: manh truoc/sau
    ff = cls == "flap_front"
    tt = smoothstep((0.205 - z[ff]) / (0.205 - 0.170))
    Wf = np.zeros((ff.sum(), nb)); Wf[:, idx["loincloth_front"]] = tt; Wf[:, idx["pelvis"]] = 1 - tt
    W[ff] = Wf
    fb = cls == "flap_back"
    W[fb] = 0; W[fb, idx["pelvis"]] = 1
    # --- cat top-4, bo trong so nho, chuan hoa
    W = finalize(W, prm["prune"])
    return dict(W=W, names=names, cls=cls, P=P, inv=inv, hop=hop, edges=E, comp=comp, fallback=FALLBACK)


def finalize(W, prune=0.02, k=4):
    W = W.copy()
    W[W < prune] = 0
    order = np.argsort(-W, axis=1)
    keep = np.zeros_like(W, bool)
    rows = np.arange(len(W))[:, None]
    keep[rows, order[:, :k]] = True
    W = np.where(keep, W, 0.0)
    s = W.sum(1, keepdims=True)
    assert (s > 0).all()
    return W / s
