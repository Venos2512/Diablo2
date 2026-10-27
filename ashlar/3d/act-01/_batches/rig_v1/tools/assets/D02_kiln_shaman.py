"""D02 Kiln-Shaman A (wave 2). Canon top of the pot 0.47H = 0.846 m (user 2026-10-27 chose canon over the sheet's 0.77H).
Small hooded shaman carrying a big kiln pot on the head/back. Stage-0 islands: 1 = robe + hood + horns + pot + sleeves
(one piece, z 0.03-0.85), 4 = legs + feet (to z 0.39), 0 = under-skirt (teal, z 0.09-0.43), 11/19 = hands, 3 = mask.
Brief: robe F/L/B/R, pot rigid (it is fused with the hood, so it rides the head with the hood).
"""
GENERIC = True
HEIGHT_M = 0.846
ISL = dict(torso=[1], legs=[4], arms=[11, 19])
SYM = dict(c=0.0, ops=[], center=False)
# head = mask + the top of the robe piece above the shoulders near the axis (hood, horns, pot); kept in Body (user, P05)
# |x| < 0.18: the hood/pot bottom rests on the shoulders, at 0.26 the head band reached the arms (head_turn 24x)
HEAD = dict(islands=[3], cut=[1], z_chin=0.60, pred=lambda c: abs(c.x) < 0.18, in_body=True)
# robe below the knees and the under-skirt kept inside Body (user preference since P02), F/L/B/R chains (brief)
ROBE_CUTS = {'Cloth_Robe': dict(islands=[1, 0], z_max=0.42, in_body=True)}
# pot on the back (user 2026-10-27: "split the round thing on the back into an accessory, cut along the rope on the
# back"): rigid accessory on the chest (carried); its faces are found in s2_labels from the texture
ACC = {'pot': dict(islands=[], mode='rigid', n=1, parent='chest')}
CLOTH = {'Cloth_Robe': dict(prefix='robe_kiln', chains=[('F', 0), ('L', 90), ('R', -90), ('B', 180)], half=30, n=3,
                            parent='pelvis', center='pelvis', edge_weights='neighbors')}
# arms: sleeves fused to the robe (no gap to measure the torso), arms at z ~0.54 (below the 0.75H search), hands from x 0.256
LM = dict(leg_win=(-0.08, 0.05), hip_blend=(0.10, 0.06, 0.05), torso_half_w=0.10, arm_z_min=0.45, wrist_x=0.26,
          neck_mode='band', head_band=0.12)   # geodesic (the z band left the hood's side edges hard: head_turn 36x)
PUSH_KW = dict(iters=6, smooth=0.7, rounds=6)
LAYER_SKIP = ('beads', 'flap_rope')


def landmarks_fix(L, parts, notes):
    """Chibi with a pot: the skill's human proportions put the chest (0.64) above the head (0.56). Spine/neck/head set
    from the mesh: legs to z 0.39 (hips ~0.42), hands at z 0.51-0.58 (shoulders ~0.545), mask z 0.54-0.70 (head joint
    0.585 under it, hood top ~0.78; the pot above/behind rides the head)."""
    S = dict(pelvis=(0.0, 0.02, 0.42), spine1=(0.0, 0.02, 0.46), spine2=(0.0, 0.01, 0.50), chest=(0.0, 0.0, 0.53),
             neck=(0.0, -0.02, 0.565), head=(0.0, -0.05, 0.585), head_top=(0.0, -0.04, 0.78),
             shoulder=(0.117, 0.0, 0.545), elbow=(0.195, -0.01, 0.54), wrist=(0.26, -0.05, 0.535))
    for k_, v in S.items():
        if k_ in L:
            L[k_] = v
    notes.append('spine/neck/head/arm joints set by hand (chibi proportions)')


# Arm band (as U05): the sleeves hang to the hip (z 0.44) fused with the robe and were forearm next to pelvis (20-27x).
# Arm = within r_one of the arm bones; torso = lower than `below` under the shoulder joint and farther than r_zero.
SLEEVE_X = 0.20
# the sleeve tip is fused to the robe hem at z ~0.40 (33x once the sleeve follows the arm): split the sleeve faces
# (|x| > 0.20, z 0.38-0.62) from the rest below 0.47 (detach_z is in 1.8 m units: x K 0.47)
SLEEVE_GEO = dict(islands=[1], x_min=0.20, z_min=0.38, z_max=0.62, detach_z=1.0)
ARM_BAND = dict(r_one=0.055, r_zero=0.10, below=0.06)   # (0.05/0.075/0.05 made the forearm edge harder: elbows 21x)


def arm_band(body, rig, band, ones, zeros, rep):
    V = body.data.vertices; B = rig.data.bones; d = ARM_BAND
    segs = [(B[n].head_local, B[n].tail_local) for s_ in 'LR' for n in (f'{s_}_UpperArm', f'{s_}_ForeArm', f'{s_}_Hand')]
    def dist(p):
        best = 1e9
        for a_, b_ in segs:
            ab = b_ - a_; t = max(0.0, min(1.0, (p - a_).dot(ab) / max(ab.length_squared, 1e-12)))
            best = min(best, (p - (a_ + ab * t)).length)
        return best
    import rigbatch as rb
    zl = B['L_UpperArm'].head_local.z - d['below']; z0 = set(zeros); ones2, zeros2 = [], []
    # user 2026-10-27 (twice: the hanging sleeve stayed behind, first beyond x 0.20, then under the upper arm): the
    # sleeve is what the robe piece connects to the forearm/hand through, below the shoulder top (z 0.60), not behind
    # the back (y 0.13, the pot sling) and outside the torso core (|x| 0.13) -> rigbatch.sleeve_flood. Near the body
    # (|x| < 0.16) only what is close to the arm bones is all arm; the rest there blends.
    isl = body.data.attributes['rb_isl']
    sleeve = rb.sleeve_flood(body, rig, seed_r=0.06, core_x=0.13, z_min=0.38,
                             allowed=lambda i: isl.data[i].value in (1, 11, 19) and V[i].co.z < 0.60 and V[i].co.y < 0.13)
    for i in band:
        c = V[i].co; r = dist(c)
        if r < d['r_one'] or (i in sleeve and (abs(c.x) > 0.16 or r < 0.07)):
            ones2.append(i)
        elif i in sleeve:
            continue
        elif i in z0 or (c.z < zl and r > d['r_zero'] and abs(c.x) < 0.18):
            zeros2.append(i)
    rep['arm_band'] = dict(ones=len(ones2), zeros=len(zeros2), free=len(band) - len(ones2) - len(zeros2))
    return ones2, zeros2


def _pot_verts(ob):
    """Red pot behind the hood + whatever the red encloses (diamond patches, rim, the rope round its neck). Non-red
    regions that reach the robe (z < 0.45) or the hood (y < -0.08) stay Body: the cut follows the sling rope."""
    import bpy, colorsys, collections
    import numpy as np
    m = ob.data; V = m.vertices; n = len(V)
    img = next((im for im in bpy.data.images if 'basecolor' in im.name.lower()), None)
    if img is None or not m.uv_layers:
        return set()
    im = img.copy(); im.scale(1024, 1024); W, H = im.size
    px = np.empty(W * H * 4, dtype=np.float32); im.pixels.foreach_get(px); px = px.reshape(H, W, 4); bpy.data.images.remove(im)
    uv = m.uv_layers.active.data; acc = np.zeros((n, 3)); cnt = np.zeros(n)
    for li, lp in enumerate(m.loops):
        u, v = uv[li].uv
        acc[lp.vertex_index] += px[min(H - 1, max(0, int(v % 1.0 * H))), min(W - 1, max(0, int(u % 1.0 * W))), :3]; cnt[lp.vertex_index] += 1
    rgb = acc / np.maximum(cnt, 1)[:, None]
    lab, _ = __import__('rigbatch')._islands(ob)
    # the robe+pot piece only (the hand islands are not connected to anything and read as 'enclosed'), not the
    # sleeves (red patches at |x| > 0.25)
    zone = lambda c, i=None: c.y > -0.08 and c.z > 0.42 and abs(c.x) < 0.25
    red = set()
    for i in range(n):
        h, s_, val = colorsys.rgb_to_hsv(*rgb[i])
        if lab[i] == 1 and zone(V[i].co) and (h > 0.94 or h < 0.06) and s_ > 0.45 and val > 0.08:
            red.add(i)
    nb = collections.defaultdict(list)
    for e in m.edges:
        a_, b_ = e.vertices; nb[a_].append(b_); nb[b_].append(a_)
    seen = set(); pot = set(red)
    for i in range(n):                      # non-red components: enclosed by the red -> pot; reaching robe/hood -> Body
        if i in red or i in seen or lab[i] != 1 or not zone(V[i].co):
            continue
        comp = [i]; seen.add(i); out = False; k = 0
        while k < len(comp):
            j = comp[k]; k += 1
            for t in nb[j]:
                if t in red or t in seen:
                    continue
                if not zone(V[t].co):
                    out = True; continue
                seen.add(t); comp.append(t)
        if not out:
            pot |= set(comp)
    # neck + rim + the rope round the neck: above z 0.74 within 0.125 of the pot axis (0.01, 0.045); the ring touches the
    # hood in front, so the enclosure test left it with the head
    for i in range(n):
        c = V[i].co
        if lab[i] == 1 and c.z > 0.74 and ((c.x - 0.01) ** 2 + (c.y - 0.045) ** 2) ** 0.5 < 0.125:
            pot.add(i)
    # fill the patches left at the hood and rope edges: a vertex whose neighbours are mostly pot is pot (4 passes)
    for _ in range(4):
        add = [i for i in range(n) if i not in pot and lab[i] == 1 and zone(V[i].co) and nb[i]
               and sum(1 for t in nb[i] if t in pot) >= 0.6 * len(nb[i])]
        if not add:
            break
        pot |= set(add)
    return pot


def s2_labels(ob, lab, isl, info):
    import sys, stages
    A = sys.modules[__name__]
    labels = stages.default_labels(A, ob, lab, isl)
    pot = _pot_verts(ob)
    at = ob.data.attributes.get('rb_acc') or ob.data.attributes.new('rb_acc', 'INT', 'POINT')
    code = list(ACC).index('pot') + 1; nf = 0
    for p in ob.data.polygons:
        if all(v in pot for v in p.vertices):
            labels[p.index] = 'Accessory'; nf += 1
            for v in p.vertices:
                at.data[v].value = code
    info['pot'] = dict(verts=len(pot), faces=nf)
    return labels


# The pot (rigid on the chest) was cut from the robe/hood piece: the Body and Head edges along the cut turned with the
# head/spine and gapped 230 mm (head_turn) / 174 mm (bend). Edge vertices take the pot bone, blending back to their
# own weights over POT_BAND (geodesic).
POT_BAND = 0.04


def _pot_seam(part, acc, rep, key):
    import rigbatch as rb
    rc = rb.rc
    cut = set(rb.coincident_map(part, acc)) if acc is not None else set()
    if not cut:
        return
    lbl, dist = rb.geodesic_voronoi(part, {i: i for i in cut}, lambda i: True)
    n = 0
    for i, d in dist.items():
        if d < POT_BAND:
            rc.set_weights(part, i, rb.blend({'pot_01': 1.0}, rb.vertex_weights(part, i), rc.sm(0.0, POT_BAND, d))); n += 1
    rep[key] = dict(cut=len(cut), band=n)


def body_weights_fix(body, rig, rep):
    import stages
    parts = stages.parts_by_role()
    acc = parts.get('Accessory')
    _pot_seam(body, acc, rep, 'pot_seam_body')
    if parts.get('Head') is not None:
        _pot_seam(parts['Head'], acc, rep, 'pot_seam_head')


# layers + springs (spring_layers.py): robe F/L/R/B in Body (presets); the pot is rigid (no spring).
# auto radii (pelvis 0.17, spine 0.19/0.16) reached into the hood and out of the robe: the body under the robe is
# ~+-0.14 at the hips -> set by hand; legs auto
SPRING = dict(collections={'Robe': ['robe_kiln_'], 'Pot': ['pot_']}, chains={'pot_01': dict(enabled=False)},
              radius={'pelvis': 0.13, 'spine_01': 0.12, 'spine_02': 0.11})
