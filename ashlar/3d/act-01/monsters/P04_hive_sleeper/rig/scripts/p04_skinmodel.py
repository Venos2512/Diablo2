"""P04 Hive-Sleeper: region weight models on top of p04_weights.Skin (positions in metres, rig frame).

Regions (welded mesh components + masks): big shirt piece = trunk along Y + head/neck by a harmonic field from the skull
core to the body (domes and the trunk behind the neck held at 0) + shoulder cap + flank / rump / bib cloth chains along Z +
partial follow of the arm and thigh next to the cloth + rigid dome caps (grooves free); arms (chain along the arm path,
twist ramps, thumb on Hand); legs + belly piece (leg chains along the leg path, pelvis at the hip, belly along Y); sleeves;
linen bits (shirt model); ribbons (follow the shirt/domes under them, smoothed along the strip; knots averaged).
Parameters are module constants (run log in rig.log).
"""
import numpy as np
from p04_weights import sm, chain1d, seg_param, seg_dist

TRUNK = ['head', 'neck_02', 'neck', 'chest', 'spine_02', 'spine_01', 'pelvis']     # ascending in y
TRUNK_HALF = [0.025, 0.025, 0.03, 0.06, 0.06, 0.06]
HEAD_CORE = 0.12             # skull-centre radius held at head = 1 (skull interior)
HEAD_FRONT = 0.03            # ... and everything this far in front of the atlas plane (face, hair, hood brim) ...
HEAD_CORE_OUT = 0.24         # ... within this radius
DOME_SKULL_CLEAR = 0.20      # sphere nodes this close to the skull centre are the hood, not a dome
DOME_LINEN_HUE = (12.0, 38.0)   # base-colour hue of the linen shirt; sphere nodes of this hue are cloth over the dome base
HEAD_OUT = 0.33              # beyond this radius (or behind HEAD_Y_BODY) the field is 0 (trunk)
HEAD_Y_BODY = -0.50
HEAD_S = dict(bounds=[0.22, 0.45, 0.70], half=[0.10, 0.10, 0.10])   # s -> chest | neck | neck_02 | head
SHOULDER = dict(clav=(0.45, 0.13, 0.07), upper=(0.55, 0.12, 0.065))   # (max share, d_far, d_near)
DRAPE_SIDE_X = (0.17, 0.25)
DRAPE_SIDE_Y_GATE = (-0.74, -0.66)
DRAPE_SY = (-0.36, -0.06)        # shoulder chain -> flank chain along y
RUMP_Y = (0.20, 0.28)
BIB = dict(x=(0.17, 0.11), y_front=(-0.73, -0.67), y_back=(-0.38, -0.46))
ATTACH = (0.03, -0.09)           # cloth hand-over around the chain top: z_top + 0.03 -> z_top - 0.09
CHAIN_HALF = 0.06
FOLLOW = [('UpperArm', 0.066, 0.07, 0.50), ('ForeArm', 0.054, 0.06, 0.35), ('Thigh', 0.095, 0.06, 0.40)]   # (bone, r, reach, share)
ARM_HALF = dict(elbow=0.04, wrist=(0.03, 0.02), knuckle=(0.012, 0.02))
THUMB_X = (0.215, 0.226)         # |x| below which hand nodes in front of the knuckles are the thumb (Hand)
LEG_HALF = dict(knee=0.05, ankle=(0.03, 0.04), ball=0.02)
HIP_PELVIS = (-0.06, 0.08)       # pelvis share along the thigh from 6 cm above the hip joint to 8 cm below
LEG_MASK = (0.15, 0.10)
DOME_TOL = 0.013
DOME_GROOVE = 0.06               # dome nodes closer than this to another dome's sphere stay free (groove blend)
DOME_HOOD_FREE = 0.0             # dome nodes this close to the skull centre stay free and are not held at 0 by the head field
SMOOTH = dict(big=20, legs=14, arm=8, small=4, ribbon=8)


def trunk_y(sk, P, head=True):
    B = {n: sk.bone(n)[0] for n in TRUNK}
    bounds = [B[n][1] for n in TRUNK[:-1]]            # joint y between consecutive bones (heads of head..spine_01)
    if head:
        return chain1d(P[:, 1], bounds, TRUNK, TRUNK_HALF)
    return chain1d(P[:, 1], bounds[3:], TRUNK[3:], TRUNK_HALF[3:])


def chain_z(sk, z, c1, c2):
    top = sk.bone(c1)[0][2]; mid = sk.bone(c2)[0][2]
    d = chain1d(z, [mid], [c2, c1], [CHAIN_HALF])
    att = sm(top + ATTACH[0], top + ATTACH[1], z)
    return d, att


def mix(d1, d2, s):
    out = {}
    for n in set(d1) | set(d2):
        out[n] = d1.get(n, 0) * (1 - s) + d2.get(n, 0) * s
    return out


def skull_centre(sk):
    h, t = sk.bone('head')
    return h + (t - h) / np.linalg.norm(t - h) * 0.09


def head_field(sk, ids):
    """Harmonic s on the big piece: 1 on the head core (face, hair, hood brim: in front of the atlas plane, plus the
    skull interior), 0 on domes / far trunk; mapped to chest|neck|neck_02|head. The back half of the hood is the
    transition, so a head turn spreads over the hood instead of tearing at its sides."""
    P = sk.P[ids]; cs = skull_centre(sk)
    r = np.linalg.norm(P - cs, axis=1)
    hj, ht = sk.bone('head'); u = (ht - hj) / np.linalg.norm(ht - hj)
    f = np.array([0.0, -u[2], u[1]]) if u[2] > 0 else np.array([0.0, u[2], -u[1]])    # face direction (forward-down)
    if f[1] > 0:
        f = -f
    front = (P - hj) @ f
    dome = (sk.dome_id[ids] >= 0) & (r >= DOME_HOOD_FREE)
    core = (((front > HEAD_FRONT) & (r < HEAD_CORE_OUT)) | (r < HEAD_CORE)) & ~dome
    body = (r > HEAD_OUT) | (P[:, 1] > HEAD_Y_BODY) | dome
    s0 = sm(HEAD_OUT, HEAD_CORE, r); s0[core] = 1.0; s0[body] = 0.0
    s = sk.harmonic(ids, s0, core | body)
    zone = P[:, 1] < HEAD_Y_BODY + 0.03
    d = chain1d(s, HEAD_S['bounds'], ['chest', 'neck', 'neck_02', 'head'], HEAD_S['half'])
    sk.put(ids[zone], {n: w[zone] for n, w in d.items()})
    sk.head_s = np.zeros(sk.m); sk.head_s[ids] = s
    return dict(core=int(core.sum()), zone=int(zone.sum()), s_mean_zone=round(float(s[zone].mean()), 3))


def shirt_model(sk, ids, head=False):
    """Trunk (+ head field) + shoulder cap + cloth chains + limb follow for shirt nodes ids."""
    P = sk.P[ids]; x, y, z = P[:, 0], P[:, 1], P[:, 2]
    sk.put(ids, trunk_y(sk, P))
    rep = head_field(sk, ids) if head else None
    for s, S in ((1, 'L'), (-1, 'R')):
        g = sm(0.04, 0.10, x * s)
        ci, sh = sk.bone(f'{S}_Clavicle'); _, el = sk.bone(f'{S}_UpperArm')
        mc = SHOULDER['clav'][0] * sm(SHOULDER['clav'][1], SHOULDER['clav'][2], seg_dist(P, ci, sh)) * g
        sk.put(ids, {f'{S}_Clavicle': 1.0}, mc)
        mu = SHOULDER['upper'][0] * sm(SHOULDER['upper'][1], SHOULDER['upper'][2], seg_dist(P, sh, el)) * g
        sk.put(ids, {f'{S}_UpperArm': 1.0}, mu)
        side = sm(*DRAPE_SIDE_X, x * s) * sm(*DRAPE_SIDE_Y_GATE, y)
        sy = sm(*DRAPE_SY, y)
        d1, a1 = chain_z(sk, z, f'{S}_shirt_shoulder_01', f'{S}_shirt_shoulder_02')
        d2, a2 = chain_z(sk, z, f'{S}_shirt_flank_01', f'{S}_shirt_flank_02')
        sk.put(ids, mix(d1, d2, sy), side * ((1 - sy) * a1 + sy * a2))
    mB = sm(*RUMP_Y, y); wl = sm(-0.05, 0.05, x)
    dl, al = chain_z(sk, z, 'L_shirt_back_01', 'L_shirt_back_02')
    dr, ar = chain_z(sk, z, 'R_shirt_back_01', 'R_shirt_back_02')
    sk.put(ids, mix(dr, dl, wl), mB * (wl * al + (1 - wl) * ar))
    mF = sm(*BIB['x'], np.abs(x)) * sm(*BIB['y_front'], y) * sm(*BIB['y_back'], y)
    dF, aF = chain_z(sk, z, 'shirt_front_01', 'shirt_front_02')
    sk.put(ids, dF, mF * aF)
    # cloth hanging next to a limb partly follows it (no cloth physics in the rig; engine springs add the rest)
    for s, S in ((1, 'L'), (-1, 'R')):
        for b, r, reach, share in FOLLOW:
            h, t = sk.bone(f'{S}_{b}')
            m = share * sm(r + reach, r + 0.01, seg_dist(P, h, t)) * sm(0.02, 0.08, x * s) * sm(0.80, 0.70, z)
            sk.put(ids, {f'{S}_{b}': 1.0}, m)
    return rep


def fit_sphere(P):
    A = np.c_[2 * P, np.ones(len(P))]; b = (P ** 2).sum(1)
    sol, *_ = np.linalg.lstsq(A, b, rcond=None)
    c = sol[:3]; r = np.sqrt(sol[3] + c @ c)
    return c, r


def classify_domes(sk, ids):
    """Fit one sphere per dome on the big piece; sk.dome_id = dome index per node (-1 none), sk.dome_core = caps away
    from the grooves and the base (held rigid)."""
    P = sk.P[ids]; fits = []
    for i in (1, 2, 3):
        h, t = sk.bone(f'dome_0{i}'); c = h.copy(); r = np.linalg.norm(t - h)
        for tol in (0.05, 0.03, 0.02):
            d = np.linalg.norm(P - c, axis=1)
            sel = (np.abs(d - r) < tol) & (P[:, 2] > c[2] - 0.35 * r)
            if sel.sum() < 20:
                break
            c, r = fit_sphere(P[sel])
        fits.append((c, r))
    D = np.stack([np.abs(np.linalg.norm(P - c, axis=1) - r) for c, r in fits], 1)
    best = D.argmin(1); dmin = D.min(1)
    on = dmin < DOME_TOL
    for k, (c, r) in enumerate(fits):
        on &= ~((best == k) & (P[:, 2] < c[2] - 0.45 * r))
    import colorsys
    hue = np.array([colorsys.rgb_to_hsv(*sk.col[i])[0] * 360 for i in ids])
    linen = (hue >= DOME_LINEN_HUE[0]) & (hue < DOME_LINEN_HUE[1])
    near_skull = np.linalg.norm(P - skull_centre(sk), axis=1) < DOME_SKULL_CLEAR
    dropped = dict(linen=int((on & linen).sum()), near_skull=int((on & near_skull & ~linen).sum()))
    on &= ~linen & ~near_skull
    sk.dome_id = np.full(sk.m, -1); sk.dome_core = np.zeros(sk.m, bool)
    out = {}
    for k, (c, r) in enumerate(fits):
        m = on & (best == k); nodes = ids[m]
        other = np.delete(D[m], k, axis=1).min(1)
        height = (P[m, 2] - c[2]) / r
        near_hood = np.linalg.norm(P[m] - skull_centre(sk), axis=1) < DOME_HOOD_FREE
        core = (other > DOME_GROOVE) & (height > 0.0) & ~near_hood
        sk.dome_id[nodes] = k; sk.dome_core[nodes[core]] = True
        out[f'dome_0{k + 1}'] = dict(centre=[round(v, 4) for v in c], radius=round(float(r), 4), nodes=int(m.sum()),
                                     fixed=int(core.sum()))
    out['dropped_from_spheres'] = dropped
    return out


def apply_domes(sk):
    for k in range(3):
        nodes = np.where(sk.dome_id == k)[0]
        sk.put(nodes, {f'dome_0{k + 1}': 1.0})
        sk.region[nodes] = 3
    sk.fixed |= sk.dome_core


def arm_model(sk, ids, S, s):
    P = sk.P[ids]
    sh, el = sk.bone(f'{S}_UpperArm'); _, wr = sk.bone(f'{S}_ForeArm'); _, kn = sk.bone(f'{S}_Hand'); _, fe = sk.bone(f'{S}_Finger')
    t, dist, L = seg_param(P, [sh, el, wr, kn, fe])
    se, sw, sk_ = L[1], L[2], L[3]
    d = chain1d(t, [se, sw, sk_], [f'{S}_UpperArm', f'{S}_ForeArm', f'{S}_Hand', f'{S}_Finger'],
                [ARM_HALF['elbow'], ARM_HALF['wrist'], ARM_HALF['knuckle']])
    up = d[f'{S}_UpperArm']; fo = d[f'{S}_ForeArm']
    ut = up * 0.5 * (1 - sm(0.04, se, t))
    ft = fo * 0.6 * sm(se + 0.04, sw - 0.03, t)
    d[f'{S}_UpperArm'] = up - ut; d[f'{S}_UpperArm_twist'] = ut
    d[f'{S}_ForeArm'] = fo - ft; d[f'{S}_ForeArm_twist'] = ft
    thumb = 1 - sm(*THUMB_X, P[:, 0] * s)
    moved = d[f'{S}_Finger'] * thumb
    d[f'{S}_Finger'] = d[f'{S}_Finger'] - moved; d[f'{S}_Hand'] = d[f'{S}_Hand'] + moved
    cl = 0.5 * (1 - sm(-0.05, 0.03, t))
    d = {n: w * (1 - cl) for n, w in d.items()}; d[f'{S}_Clavicle'] = cl
    sk.put(ids, d)
    sk.region[ids] = 5
    return dict(elbow=round(se, 4), wrist=round(sw, 4), knuckle=round(sk_, 4), thumb_nodes=int((thumb > 0.5).sum()))


def leg_weights(sk, P, S):
    hp, kq = sk.bone(f'{S}_Thigh'); _, an = sk.bone(f'{S}_Calf'); _, ba = sk.bone(f'{S}_Foot'); _, to = sk.bone(f'{S}_Toe')
    t, dist, L = seg_param(P, [hp, kq, an, ba, to])
    d = chain1d(t, [L[1], L[2], L[3]], [f'{S}_Thigh', f'{S}_Calf', f'{S}_Foot', f'{S}_Toe'],
                [LEG_HALF['knee'], LEG_HALF['ankle'], LEG_HALF['ball']])
    pv = 1 - sm(*HIP_PELVIS, t)
    d = {n: w * (1 - pv) for n, w in d.items()}; d['pelvis'] = pv
    return d, dist


def legs_model(sk, ids):
    P = sk.P[ids]
    belly = trunk_y(sk, P, head=False)
    dl, distl = leg_weights(sk, P, 'L'); dr, distr = leg_weights(sk, P, 'R')
    ml = sm(*LEG_MASK, distl); mr = sm(*LEG_MASK, distr)
    ab = (1 - ml) * (1 - mr); tot = ml + mr + ab
    ml, mr, ab = ml / tot, mr / tot, ab / tot
    D = sk.dense(ids, belly) * ab[:, None] + sk.dense(ids, dl) * ml[:, None] + sk.dense(ids, dr) * mr[:, None]
    sk.W[ids] = D
    sk.region[ids] = np.where(ab > 0.5, 7, 6)
    return dict(belly_nodes=int((ab > 0.5).sum()), leg_nodes=int((ab <= 0.5).sum()))


def follow(sk, ids, pool):
    """Copy the weights of the nearest pool node."""
    Q = sk.P[pool]
    for i in ids:
        j = pool[np.argmin(((Q - sk.P[i]) ** 2).sum(1))]
        sk.W[i] = sk.W[j]


def run(sk):
    rows = sk.comp_table()
    big = max(rows, key=lambda r: r['n'])['c']
    legs = sk.comp[np.argmax(sk.P[:, 1])]
    def comp_near(p):
        return sk.comp[np.argmin(((sk.P - p) ** 2).sum(1))]
    armL = comp_near(sk.bone('L_Finger')[1]); armR = comp_near(sk.bone('R_Finger')[1])
    info = dict(components=len(rows), big=int(big), legs=int(legs), arm_L=int(armL), arm_R=int(armR))
    sleeves, bits, ribbons = [], [], []
    for r in rows:
        if r['c'] in (big, legs, armL, armR):
            continue
        if r['red'] > 0.5:
            ribbons.append(r['c']); continue
        cx, cy, cz = r['cen']
        if abs(cx) > 0.25 and cy < -0.30 and cz > 0.38 and r['n'] > 40:
            sleeves.append(r['c'])
        else:
            bits.append(r['c'])
    info.update(sleeves=len(sleeves), bits=len(bits), ribbons=len(ribbons))
    nodes = lambda cs: np.where(np.isin(sk.comp, cs))[0]
    ib = nodes([big])
    info['domes'] = classify_domes(sk, ib)
    sk.region[ib] = 1
    info['head_field'] = shirt_model(sk, ib, head=True)
    apply_domes(sk)
    sk.smooth(ib, SMOOTH['big'])
    if bits:
        i = nodes(bits); shirt_model(sk, i); sk.region[i] = 11; sk.smooth(i, SMOOTH['small'])
    for c in sleeves:
        i = nodes([c]); S = 'L' if sk.P[i, 0].mean() > 0 else 'R'
        top = sm(0.60, 0.72, sk.P[i, 2])
        sk.put(i, {f'{S}_UpperArm': 0.75, f'{S}_UpperArm_twist': 0.25})
        sk.put(i, {f'{S}_Clavicle': 0.5, 'chest': 0.5}, top)
        sk.region[i] = 8; sk.smooth(i, SMOOTH['small'])
    info['arm_L'] = arm_model(sk, nodes([armL]), 'L', 1); sk.smooth(nodes([armL]), SMOOTH['arm'])
    info['arm_R'] = arm_model(sk, nodes([armR]), 'R', -1); sk.smooth(nodes([armR]), SMOOTH['arm'])
    il = nodes([legs]); info['legs'] = legs_model(sk, il); sk.smooth(il, SMOOTH['legs'])
    # ribbons last: follow the shirt / domes / sleeves / linen bits under them (never a bare limb), smooth along the
    # strip, compact knots get one averaged set
    pool = np.where(np.isin(sk.comp, [big] + sleeves + bits))[0]
    knots = 0
    for c in ribbons:
        i = nodes([c]); follow(sk, i, pool); sk.region[i] = 10
        sk.smooth(i, SMOOTH['ribbon'])
        ext = sk.P[i].max(0) - sk.P[i].min(0)
        if np.linalg.norm(ext) < 0.07:
            sk.W[i] = sk.W[i].mean(0); knots += 1
    info['knots_averaged'] = knots
    return info
