"""P05 Wet-Nurse B (wave 1). Hood top 1.04H = 1.872 m. Mirror-symmetric mesh (no symmetry fix).
Stage-0 islands: 0 = hood + shawl + two sacks in a sling on the back + layered dress + arms + hands (one piece),
1 = both legs (inside the dress, to z 1.005), the sacks' knot bones and ribbons = small islands above z 1.6.
Chin ~1.60 (bandaged face in the hood); arms at z ~1.50; sleeve rags hang to ~1.27.
Head = hood + face only, joined back into Body after weighting (user 2026-10-27: circled hood and face, no separate
head part). The sacks and their knots follow pouch_L/R bones on the chest. Robe below 1.10 kept in Body.
"""
import collections
from mathutils import Vector

GENERIC = True
HEIGHT_M = 1.872
ISL = dict(torso=[0], legs=[1])
SYM = dict(c=0.0, ops=[], center=False)
# The sacks sit in a sling behind the hood (x-sections): front side at y ~0.02 touching the hood's back, |x| 0.04-0.29,
# y 0.0-0.32, z 1.49-1.83. Ellipsoids around them; the sling below (y > 0.26, z < 1.56) and the shawl stay out.
SACKS = {'L': (0.165, 0.16, 1.66), 'R': (-0.165, 0.16, 1.66)}
SACK_R = (0.13, 0.16, 0.17)


def _sack_side(c, grow=1.06):
    for side, (cx, cy, cz) in SACKS.items():
        if ((c.x - cx) / SACK_R[0]) ** 2 + ((c.y - cy) / SACK_R[1]) ** 2 + ((c.z - cz) / SACK_R[2]) ** 2 < grow ** 2:
            return side
    return None


# Head = the face and the FRONT of the hood only (user 2026-10-27, side view circled): in front of the line from the head
# joint (y -0.26, z 1.64) up to the hood top (y -0.16, z 1.85), above the chin (1.56). The back of the hood, which falls
# to the back and shoulders, stays with neck/chest (it was head 1 up to y +0.03). The shawl over the shoulders rises above
# the chin line (to ~1.65 at |x| 0.2-0.5): below 1.70 only the hood near the axis (|x| < 0.22). Never a sack.
HEAD_LINE = ((-0.26, 1.64), (-0.16, 1.85))


def _head(c):
    (y0, z0), (y1, z1) = HEAD_LINE
    front = (c.y - y0) * -(z1 - z0) + (c.z - z0) * (y1 - y0)      # > 0 toward -y (the face side) of the line
    return front > 0 and (c.z > 1.70 or abs(c.x) < 0.22) and _sack_side(c) is None


HEAD = dict(islands=[], cut=[0], z_chin=1.56, pred=_head, in_body=True)
# dress: all of island 0 below 1.10 (the |x| < 0.45 cut left the wide tiers in Body with leg weights, as on P01/P02);
# kept inside Body like P02 (user: no separate skirt part); small loose islands on it go with it.
ROBE_CUTS = {'Cloth_Robe': dict(islands=[0], z_max=1.10, absorb_small=400, in_body=True)}
SIX = [('FL', 35), ('FR', -35), ('L', 90), ('R', -90), ('BL', 145), ('BR', -145)]
CLOTH = {'Cloth_Robe': dict(prefix='robe_nurse', chains=SIX, half=20, n=4, parent='pelvis', center='pelvis')}
SLEEVE_GEO = dict(islands=[0], x_min=0.32, z_min=1.10, z_max=1.44)   # rags/shawl sides fused to the dress top at 1.10
# (no detach_z since the sleeve chains are gone: the slit at x 0.32 / z 1.10 only served them)
# no SLEEVES chain (user 2026-10-27: "remove these bones", the sleeve_L/R chains under the arms): the drape is skinned
# to the arm and torso only (see ARM_BAND)
# arms: one island with the shawl -> torso walk gave 0; section gap at z 1.37 puts the side wall at ~0.19 -> hw 0.17.
# wrist: forearm y-width 0.07-0.09 at x 0.66-0.78, hand widens from 0.80. Knee: the skill put it at x 0.38 (dress);
# the leg island narrows at z 0.50 (x 0.11-0.25). Legs in the dress: radii from island 1, not the Body around it.
# head band: geodesic from the hood cut (sweep: 10 cm -> head_turn 5.96x; z band + radial limit 20x on this hood);
# 6 cm since the head may only move the front of the hood (user 2026-10-27)
LM = dict(neck_half_w=0.075, leg_win=(-0.08, 0.05), neck_mode='band', head_band=0.06,
          torso_half_w=0.17, wrist_x=0.80,
          knee_z=0.50, leg_radii=dict(thigh_r=0.09, knee_r=0.07, calf_r=0.065, foot_r=0.07),
          hip_blend=(0.10, 0.06, 0.05))   # legs are one island joined at the crotch (as F01): soft hip/crotch
PUSH_KW = dict(iters=6, smooth=0.7, rounds=6)
LAYER_SKIP = ('beads', 'flap_rope')


def s2_attrs(ob, lab, isl, info):
    """Small islands above 1.55: in front of the face (y < 0) -> Head; behind -> the knots of the sack on their side.
    rb_sack (1 = L, 2 = R) on the sacks of island 0 and on their knots: stage 3 builds the pouch bones, stage 4 the weights."""
    m = ob.data; V = m.vertices
    a = m.attributes.get('rb_sack') or m.attributes.new('rb_sack', 'INT', 'POINT')
    HEAD['islands'] = []; n = collections.Counter()
    for kk, c in enumerate(isl):
        if kk in (0, 1) or min(V[i].co.z for i in c) <= 1.55:
            continue
        cen = sum((V[i].co for i in c), Vector()) / len(c)
        if cen.y < 0:
            HEAD['islands'].append(kk); continue
        for i in c:
            a.data[i].value = 1 if cen.x > 0 else 2
        n['knot_verts'] += len(c)
    for i in isl[0]:
        s = _sack_side(V[i].co)
        if s:
            a.data[i].value = 1 if s == 'L' else 2; n['sack_verts'] += 1
    info['sacks'] = dict(n, head_islands=list(HEAD['islands']))


def extra_chains(rig, parts, chains, L):
    """pouch_L/R: one bone per sack, from its base in the sling up to the knot, on the chest (not the head)."""
    import rigbatch as rb
    for side, (cx, cy, cz) in SACKS.items():
        chains[f'pouch_{side}'] = rb.rc.add_chain(rig, f'pouch_{side}', [Vector((cx, cy, cz - 0.14)), Vector((cx, cy, cz + 0.15))], 'chest')


# The arm owns only its sleeve (user 2026-10-27, Blender check, twice: moving the arm dragged the drape and the dress
# below). The stage's band made everything beyond x 0.42 above z 1.20 all arm, so the green shawl down the sides and
# the drape to the hip followed the arm (a 30% falloff and dropping the sleeve chains were not enough). Here, by the
# base-colour texture: "sleeve" = beige cloth/skin joined (flood fill) to the forearm (|x| > seed_x) above z_min and
# beyond x_min -> all arm; green shawl and anything else of the band lower than `below` under the shoulder joint and
# inside x_max -> all torso; the rest (the shawl over the shoulder and the upper arm) is the harmonic blend between.
ARM_BAND = dict(seed_x=0.60, x_min=0.25, z_min=1.20, below=0.12, x_max=0.62, smooth=2, buffer=0.07)


def _sleeve_verts(ob):
    """Beige (not dark olive) vertices joined to the forearm through beige vertices; None without a base-colour image."""
    import bpy, colorsys
    import numpy as np
    m = ob.data; V = m.vertices; n = len(V); d = ARM_BAND
    img = next((im for im in bpy.data.images if 'basecolor' in im.name.lower()), None)
    if img is None or not m.uv_layers:
        return None
    im = img.copy(); im.scale(1024, 1024); W, H = im.size
    px = np.empty(W * H * 4, dtype=np.float32); im.pixels.foreach_get(px); px = px.reshape(H, W, 4)
    bpy.data.images.remove(im)
    uv = m.uv_layers.active.data; acc = np.zeros((n, 3)); cnt = np.zeros(n)
    for li, lp in enumerate(m.loops):
        u, v = uv[li].uv
        acc[lp.vertex_index] += px[min(H - 1, max(0, int(v % 1.0 * H))), min(W - 1, max(0, int(u % 1.0 * W))), :3]
        cnt[lp.vertex_index] += 1
    rgb = acc / np.maximum(cnt, 1)[:, None]
    g = np.zeros(n)
    for i in range(n):
        r_, g_, b_ = rgb[i]; h, s, val = colorsys.rgb_to_hsv(r_, g_, b_)
        g[i] = 1.0 if (val < 0.42 and g_ >= 0.85 * r_ and s > 0.18) else 0.0     # dark olive shawl (linear colour)
    nb = [[] for _ in range(n)]
    for e in m.edges:
        a_, b_ = e.vertices; nb[a_].append(b_); nb[b_].append(a_)
    for _ in range(d['smooth']):                  # the shawl texture is mottled: average with the 1-ring
        g = np.array([0.5 * g[i] + 0.5 * (sum(g[j] for j in nb[i]) / len(nb[i])) if nb[i] else g[i] for i in range(n)])
    beige = lambda i: g[i] < 0.5 and abs(V[i].co.x) > d['x_min'] and V[i].co.z > d['z_min']
    out = set(i for i in range(n) if abs(V[i].co.x) > d['seed_x'] and beige(i)); stack = list(out)
    while stack:
        i = stack.pop()
        for j in nb[i]:
            if j not in out and beige(j) and (V[j].co.x > 0) == (V[i].co.x > 0):
                out.add(j); stack.append(j)
    return out


def arm_band(body, rig, band, ones, zeros, rep):
    V = body.data.vertices; d = ARM_BAND
    sleeve = _sleeve_verts(body)
    if sleeve is None:
        return ones, zeros
    import rigbatch as rb
    zl = rig.data.bones['L_UpperArm'].head_local.z - d['below']
    ones2 = [i for i in band if i in sleeve or abs(V[i].co.x) > d['x_max']]
    o = set(ones2); z0 = set(zeros); bset = set(band)
    # no torso anchor within `buffer` (geodesic) of the sleeve: sleeve 1 next to torso 0 tore 25-32x at the back armpit
    _, dist = rb.geodesic_voronoi(body, {i: i for i in o}, lambda i: i in bset)
    zeros2 = [i for i in band if i not in o and dist.get(i, 1e9) > d['buffer']
              and (i in z0 or (V[i].co.z < zl and abs(V[i].co.x) < d['x_max']))]
    rep['arm_band'] = dict(sleeve=len(sleeve), ones=len(ones2), zeros=len(zeros2), free=len(band) - len(ones2) - len(zeros2),
                           torso_below_z=round(zl, 3), was=dict(ones=len(ones), zeros=len(zeros)))
    return ones2, zeros2


# Under the chin the head part meets the scarf and the throat along long faces (5-13 cm): the 6 cm head band left head 1
# next to chest 1 on 71 edges and tilting the head back pulled the throat into a flat sheet (user 2026-10-27). In the
# throat zone (mask below) the head band is 15 cm instead; outside it the 6 cm result stays (hood back, shoulders).
THROAT = dict(band=0.15, x=(0.20, 0.13), y=(-0.14, -0.22), z=(1.30, 1.38, 1.66, 1.72))


def _throat_band(body, rep):
    import rigbatch as rb, stages
    rc = rb.rc; V = body.data.vertices; t = THROAT
    head = stages.parts_by_role().get('Head')
    if head is None:
        return
    mask = lambda c: (rc.sm(t['x'][0], t['x'][1], abs(c.x)) * rc.sm(t['y'][0], t['y'][1], c.y)
                      * rc.sm(t['z'][0], t['z'][1], c.z) * (1 - rc.sm(t['z'][2], t['z'][3], c.z)))
    w6 = [rb.vertex_weights(body, i) for i in range(len(V))]
    rb.head_seam_band(body, head, t['band'])
    n = 0
    for i in range(len(V)):
        w = rb.vertex_weights(body, i)
        if w != w6[i]:
            m = mask(V[i].co)
            rc.set_weights(body, i, rb.blend(w6[i], w, m) if m > 0 else w6[i]); n += m > 0
    rep['throat_band'] = dict(verts=n, **t)


def body_weights_fix(body, rig, rep):
    """Throat head band (_throat_band), then: sacks and knots ride on their pouch bone (after the head band). Rigid sacks tore 7.4x on head_turn at the
    hood/sack contact and 7.2x on shrug at their rim; blending the Body around them into pouch moved the tear onto the
    hood's cut (10x). So the sack surface itself takes the transition: from the weights of the Body vertex it touches
    (head 1 on the hood's cut, head/chest on the hood's back, torso on the sling) to pouch over 6 cm (geodesic)."""
    import rigbatch as rb, stages
    _throat_band(body, rep)
    rc = rb.rc; k = rb.K; V = body.data.vertices
    a = body.data.attributes.get('rb_sack')
    if a is None:
        return
    head = stages.parts_by_role().get('Head')
    cut = set(rb.coincident_map(body, head)) if head is not None else set()   # sack vertices on the hood's cut stay head 1 (welded to the head)
    sack = {i: ('pouch_L_01' if a.data[i].value == 1 else 'pouch_R_01') for i in range(len(V)) if a.data[i].value and i not in cut}
    ring ={j for e in body.data.edges for j in e.vertices if (e.vertices[0] in sack) != (e.vertices[1] in sack) and j not in sack}
    Wr = {j: rb.vertex_weights(body, j) for j in ring}
    for i, b in sack.items():
        rc.set_weights(body, i, {b: 1.0})
    lbl, dist = rb.geodesic_voronoi(body, {j: j for j in ring}, lambda i: i in sack)
    n = 0
    for i, d in dist.items():
        if i in sack and d < 0.06 * k:
            rc.set_weights(body, i, rb.blend(Wr[lbl[i]], {sack[i]: 1.0}, rc.sm(0.0, 0.06 * k, d))); n += 1
    rep['sacks'] = dict(verts=len(sack), ring=len(ring), blended=n)


# layers + springs (spring_layers.py). Robe: floor-length 6-chain dress like P02 (it sagged 7.8 cm at rest with the
# presets): stiffer, half gravity. Pouches: heavy sacks pointing UP from the sling -> stiff, little gravity, a small
# bounce only; outside the robe layer.
_ROBE = {f'robe_nurse_{t}_01': dict(stiffness=s, gravity=0.25) for t, s in
         (('FL', 2.25), ('FR', 2.25), ('L', 2.4), ('R', 2.4), ('BL', 2.55), ('BR', 2.55))}
SPRING = dict(collections={'Robe': ['robe_nurse_'], 'Pouch': ['pouch_']},
              # dress + shawl in Body inflate the auto radii (pelvis 0.38, spine 0.35): torso half-width 0.17, hips +-0.094
              radius={'pelvis': 0.15, 'spine_01': 0.15, 'spine_02': 0.16},
              chains=_ROBE,
              extra_chains=[dict(root=f'pouch_{s}_01', stiffness=2.5, drag=0.5, gravity=0.15, hitRadius=0.08, endLength=0.0,
                                 wind=0.1, layer=2) for s in 'LR'])
