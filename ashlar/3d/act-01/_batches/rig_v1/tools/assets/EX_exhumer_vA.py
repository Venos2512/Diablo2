"""EX Exhumer A (hero, ashlar/3d/heroes/EX_exhumer/vA). H 1.8 m (user G1 2026-10-29), k = 1.0.
Lean hunter in a long open coat, wide-brim hat, lantern on the L chest strap, bolt quiver on the L hip, pouch on the R hip.
Stage-0 islands (importer weld, centred x): 0 = head + collar + coat + arms + gloves (z 0.23-1.70, one piece),
2 = trousers + boots (z 0-1.07), 1 = hat (z 1.61-1.80) + 7 hat buckle, 4 = lantern (z 1.23-1.43) + 6/11/8 its ring and
hook (to z 1.50), 10 = quiver (x 0.13-0.26, z 0.93-1.16), 22 = pouch (x -0.25..-0.14, z 0.95-1.13), 3 belt buckle,
12-15/24-27 knee and ankle buckles, 5/9/16-21/28/29 strap studs. Gloves: fingers fused into a mitten (one Hand bone).
G1 (user 2026-10-29): 1.8 m; hand sockets both sides (pipeline *_weapon_attach, child of Hand, no deform);
hat rigid on the head (kept in Body); lantern, quiver, pouch on spring chains; all four coat tails on spring chains.
"""
GENERIC = True
HEIGHT_M = 1.8
ISL = dict(torso=[0], legs=[2])
SYM = dict(c=0.004, ops=[], center=True)
# head = hat (islands 1, 7) + the face cut from island 0 above the chin, inside the tall collar (collar |x| >= 0.11,
# back y >= 0.0 at z 1.54-1.60); kept in Body (user preference)
HEAD = dict(islands=[1, 7], cut=[0], z_chin=1.535, pred=lambda c: abs(c.x) < 0.10 and c.y < -0.005, in_body=True)
# coat below the belt kept in Body (user preference), four tails: front L/R, back L/R (user G1)
ROBE_CUTS = {'Cloth_Robe': dict(islands=[0], z_max=1.00, in_body=True)}
# user 2026-10-29: more chains on the coat -> + hip sides L/R (6 chains)
TAILS = [('FL', 30), ('L', 90), ('BL', 150), ('FR', -30), ('R', -90), ('BR', -150)]
CLOTH = {'Cloth_Robe': dict(prefix='robe_coat', chains=TAILS, half=30, n=4, parent='pelvis', center='pelvis',
                            edge_weights='neighbors')}
# lantern hangs from its hook on the chest strap; quiver and pouch hang from the belt: short spring strands (user G1)
ACC = {'lantern': dict(islands=[4, 6, 11, 8], mode='strand', n=2, parent='chest'),
       'quiver': dict(islands=[10], mode='strand', n=1, parent='pelvis'),     # user 2026-10-29: one bone each
       'pouch': dict(islands=[22], mode='strand', n=1, parent='pelvis')}
# trousers are one piece (crotch tore 11-14x on walk/kick/side_step, s5 2026-10-29): hip_blend as F01/D04; head band
# from the face cut short, the collar and scarf are capped by HEAD_MASK below
LM = dict(hip_blend=(0.10, 0.06, 0.05), leg_win=(-0.08, 0.05), neck_mode='band', head_band=0.06, neck_half_w=0.07)
PUSH_KW = dict(iters=6, smooth=0.7, rounds=6)
LAYER_SKIP = ('beads', 'flap_rope')

# The coat is split at the front (open) and at the back (slit from z ~0.81 to the hem): the angular blend between the
# nearest two chains would pull a panel edge with the tail across the slit. Each side takes only its own pair (FL+L+BL for
# x > 0, FR+R+BR for x < 0), ramped across x over SIDE_W (the back is one piece above the slit).
SIDE_W = 0.03


def cloth_weights_fix(parts, rig, chains, rep):
    import sys, stages
    import rigbatch as rb
    A = sys.modules[__name__]; rc = rb.rc; k = rb.K
    body = parts['Body']; V = body.data.vertices
    spec = CLOTH['Cloth_Robe']; ac = body.data.attributes['rb_cloth']; code = stages.inbody_code(A, 'Cloth_Robe')
    region = [i for i in range(len(V)) if ac.data[i].value == code]
    import json
    lm = json.loads(rig['rb_landmarks'])
    side = {}
    for tag, sgn in (('L', 1), ('R', -1)):
        sp = dict(spec, chains=[t for t in TAILS if t[1] * sgn > 0])
        stages._inbody_cloth_weights(A, 'Cloth_Robe', sp, body, rig, chains, lm, {}, k)
        side[tag] = {i: rb.vertex_weights(body, i) for i in region}
    for i in region:
        s_ = rc.sm(-SIDE_W, SIDE_W, V[i].co.x)
        rc.set_weights(body, i, rb.blend(side['R'][i], side['L'][i], s_))
    rc.finalize_weights(body)
    rep['coat_sides'] = len(region)


def _green_verts(ob):
    """Coat green (texture hue 0.25-0.6, sat > 0.15) on island 0 above the chin: the collar's inner rim (z 1.50-1.60)."""
    import bpy, colorsys
    import numpy as np
    m = ob.data; n = len(m.vertices)
    img = next(im for im in bpy.data.images if 'basecolor' in im.name.lower())
    im = img.copy(); im.scale(1024, 1024); W, H = im.size
    px = np.empty(W * H * 4, dtype=np.float32); im.pixels.foreach_get(px); px = px.reshape(H, W, 4); bpy.data.images.remove(im)
    uv = m.uv_layers.active.data; acc = np.zeros((n, 3)); cnt = np.zeros(n)
    for li, lp in enumerate(m.loops):
        u, v = uv[li].uv
        acc[lp.vertex_index] += px[min(H - 1, max(0, int(v % 1.0 * H))), min(W - 1, max(0, int(u % 1.0 * W))), :3]; cnt[lp.vertex_index] += 1
    rgb = acc / np.maximum(cnt, 1)[:, None]; out = set()
    for i in range(n):
        if m.vertices[i].co.z < HEAD['z_chin'] - 0.01:
            continue
        h, s_, _ = colorsys.rgb_to_hsv(*rgb[i])
        if 0.25 < h < 0.6 and s_ > 0.15:
            out.add(i)
    return out


def s2_labels(ob, lab, isl, info):
    """Default labels; faces of the face cut that are coat green (the tall collar's inner rim lies above the chin inside
    |x| 0.10) go back to Body, then the cut keeps only its largest connected piece (s2 2026-10-29)."""
    import sys, collections, stages
    A = sys.modules[__name__]
    labels = stages.default_labels(A, ob, lab, isl)
    m = ob.data
    green = _green_verts(ob)
    nfg = 0
    for p in m.polygons:
        if labels[p.index] == 'Head' and lab[p.vertices[0]] == 0 and sum(v in green for v in p.vertices) * 2 >= len(p.vertices):
            labels[p.index] = 'Body'; nfg += 1
    info['head_collar_green_faces'] = nfg
    cut = [p.index for p in m.polygons if labels[p.index] == 'Head' and lab[p.vertices[0]] == 0]
    byv = collections.defaultdict(list)
    for fi in cut:
        for v in m.polygons[fi].vertices:
            byv[v].append(fi)
    seen, comps = set(), []
    for f0 in cut:
        if f0 in seen:
            continue
        comp = [f0]; seen.add(f0); j = 0
        while j < len(comp):
            for v in m.polygons[comp[j]].vertices:
                for g in byv[v]:
                    if g not in seen:
                        seen.add(g); comp.append(g)
            j += 1
        comps.append(comp)
    comps.sort(key=len, reverse=True)
    for comp in comps[1:]:
        for fi in comp:
            labels[fi] = 'Body'
    info['head_cut_pieces'] = [len(c) for c in comps]
    return labels


def landmarks_fix(L, parts, notes):
    """Measured on the mesh (s2, centred x), the skill's numbers were off: the torso section gave half-width 0.013
    (coat + straps are one piece with the arms: shoulder at x 0.05), the neck ran back to y +0.04 inside the collar and
    the knees sat on the boot-top buckles (x 0.24). Mesh: torso |x| 0.19 at z 1.30 (armpit), arm axis z ~1.425
    y ~-0.03, glove from x ~0.75 to 0.93, legs: hips x 0.10 at z 0.92, ankles x ~0.205 at z 0.10, boot tops z 0.54."""
    S = dict(neck=(0.0, -0.045, 1.475), shoulder=(0.19, -0.03, 1.43), elbow=(0.475, -0.02, 1.425),
             wrist=(0.75, -0.05, 1.42))
    for k_, v in S.items():
        L[k_] = v
    L['hand_end'] = (0.93, -0.085, 1.415)
    for s_, sg in (('L_', 1), ('R_', -1), ('', 1)):
        L[s_ + 'hip'] = (sg * 0.095, -0.065, 0.925)
        L[s_ + 'knee'] = (sg * 0.155, -0.085, 0.50)
    notes.append('neck/arm/hip/knee joints set from the mesh sections (landmarks_fix)')


# Brief: the head moves only the head/hat/face, not the nape, collar or scarf. On Body (the face piece keeps head 1):
# head share capped to sm(z) (scarf under the chin, z < 1.50 none) and, behind y COLLAR_Y (the collar back rim, up to
# z 1.60), to none below z 1.60; what is taken off goes to the neck.
HEAD_MASK = dict(z=(1.50, 1.55), y=(-0.01, 0.01), zb=(1.60, 1.63))


def body_weights_fix(body, rig, rep):
    import rigbatch as rb
    rc = rb.rc; m = HEAD_MASK; n = 0
    for v in body.data.vertices:
        c = v.co
        w = rb.vertex_weights(body, v.index); h = w.get('head', 0.0)
        if h <= 0:
            continue
        f = rc.sm(m['z'][0], m['z'][1], c.z) * (1 - rc.sm(m['y'][0], m['y'][1], c.y) * (1 - rc.sm(m['zb'][0], m['zb'][1], c.z)))
        if h > f + 1e-4:
            w['head'] = f; w['neck'] = w.get('neck', 0.0) + h - f
            rc.set_weights(body, v.index, {k_: x for k_, x in w.items() if x > 1e-4}); n += 1
    rep['head_mask_body'] = n
    # knee buckles on the boot tops (islands 12-14 / 24-26, z 0.37-0.50) straddle the knee: thigh/calf blend tore
    # them on sit (13.7x); they belong to the boot -> calf 1
    ai = body.data.attributes['rb_isl']; nb = 0
    for v in body.data.vertices:
        if ai.data[v.index].value in KNEE_BUCKLES:
            rc.set_weights(body, v.index, {('L' if v.co.x > 0 else 'R') + '_Calf': 1.0}); nb += 1
    rep['knee_buckles'] = nb


KNEE_BUCKLES = (12, 13, 14, 24, 25, 26)


# layers + springs (spring_layers.py), user "ok, next" 2026-10-29: coat tails FL/FR/BL/BR in Body (presets); lantern,
# quiver, pouch are short spring strands (user G1), outside the coat
# the coat is open at the front and slit at the back below z 0.81: no ring links FL-FR / BL-BR across the openings.
# Auto torso radii (pelvis 0.177, spine_02 0.167) are the coat + straps over the hips/chest and reach the tail roots
# -> set from the body (trousers |x| 0.18 at the belt, torso |x| 0.13-0.14 at z 1.2)
SPRING = dict(collections={'Coat': ['robe_coat_'], 'Accessory': ['lantern_', 'quiver_', 'pouch_']},
              drop_links=[['robe_coat_FL_01', 'robe_coat_FR_01'], ['robe_coat_BL_01', 'robe_coat_BR_01']],
              radius={'pelvis': 0.13, 'spine_01': 0.12, 'spine_02': 0.13, 'L_Calf': 0.08, 'R_Calf': 0.08},
              # the editor preset list with the knee spheres fixed at 0.08 (auto 0.11 from the buckles touched the front tails)
              colliders=[dict(bone='pelvis', type='sphere'), dict(bone='spine_01', type='capsule'), dict(bone='spine_02', type='capsule'),
                         dict(bone='L_Thigh', type='capsule'), dict(bone='R_Thigh', type='capsule'),
                         dict(bone='L_Calf', type='capsule'), dict(bone='R_Calf', type='capsule'),
                         dict(bone='L_Calf', type='sphere', at=0.1, radius=0.08), dict(bone='R_Calf', type='sphere', at=0.1, radius=0.08)])
