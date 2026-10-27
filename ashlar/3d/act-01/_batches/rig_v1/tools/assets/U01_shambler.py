"""U01 Shambler (pilot of rig_v1). Height 0.95H = 1.71 m (catalogue), k = 0.95.

Mesh (stage 0, islands after the importer weld): 0 torso+tunic+cape+sleeves (one piece), 1 head,
2/3/4/5/6/10 hair tufts, 12 coin, 7 scarf bit (touches 0), 8/11 rope ends, 9 rope knot, 13/15 legs, 14/16 arms.
Symmetry (stage 0): body axis x=+0.031 (torso bands, legs pair +0.030), arms pair symmetric about 0
(L arm island 5 cm shorter than R), head island axis +0.054 (cowl ring +0.041).
"""
import bpy, os, json, math, collections
import rigbatch as rb

CFG = dict(height_m=1.71)
# measured on stage-1 close-ups (c1_*.png, 5 cm grid) and sections (sec_*.png)
Z_CHIN = 1.497        # bottom of the jaw band at the front; the head island continues as a neck stub to 1.417
Z_WAIST = 1.12        # rope band around the waist (rope knot island z 1.11-1.18)
Z_CAPE_TOP = 1.45     # cape labelled below this height; above it the cape merges into the shoulders/cowl (Body)
Y_CAPE_SEED = -0.06   # free-edge loop of the torso island: y > this = cape edge, else scarf edge (front)
ISL = dict(torso=0, head=1, hair=(2, 3, 4, 5, 6, 10), coin=12, scarf_bit=7, rope_ends=(8, 11), rope_knot=9,
           legs=(13, 15), arms=(14, 16))
C_BODY = 0.031


def s1(ctx):
    """Skill stage 1: measure + fix symmetry. Arms (islands 14/16 only; sleeves are already symmetric
    about the body axis) get x += c*sm(0.30k, 0.55k, |x-c|); then the whole mesh moves by -c."""
    rc = rb.rc; k = rb.K
    rb.open_blend(os.path.join(ctx['work'], 's0_intake.blend'))
    ob = bpy.data.objects[ctx['aid'] + '_Src']
    bk = ob.data.copy(); bk.name = ctx['aid'] + '_Src_backup'; bk.use_fake_user = True
    ob['rb_group_order'] = json.dumps([g.name for g in ob.vertex_groups])
    lab, isl = rb._islands(ob)
    arm_verts = [i for kk in ISL['arms'] for i in isl[kk]]
    a, b = 0.30 * k, 0.55 * k
    rb.ramp_shift_x(ob, arm_verts, C_BODY, a, b)
    for v in ob.data.vertices:
        v.co.x -= C_BODY
    ob.data.update()
    fix = dict(arms_islands=list(ISL['arms']), c=C_BODY, ramp=[a, b], center_shift=-C_BODY,
               note='fix(co): if vertex in arm islands: x += c*sm(a,b,|x-c|); then x -= c')
    ob['rb_fix'] = json.dumps(fix)
    print('after fix:')
    sym = rc.symmetry_report(ob)
    V = [v.co.copy() for v in ob.data.vertices]
    def axis(ids):
        P = [V[i] for kk in ids for i in isl[kk]]
        return rc.mirror_center(P, lo=-0.06, hi=0.06, step=0.001, cap=0.05)
    rep = dict(sym={n: [round(c, 4), round(e, 4)] for n, (c, e) in sym.items()},
               legs=axis(ISL['legs']), arms=axis(ISL['arms']), torso=axis([ISL['torso']]), head=axis([ISL['head']]))
    for side, kk in (('L', 14), ('R', 16)):
        P = [V[i] for i in isl[kk]]
        tips = max(abs(p.x) for p in P); inner = min(abs(p.x) for p in P)
        rep[side + '_arm'] = dict(inner=round(inner, 4), tip=round(tips, 4))
        prof = rb.limb_profile([p * 1 for p in P] if side == 'L' else [rb.Vector((-p.x, p.y, p.z)) for p in P],
                               'x', ('y', 'z'), inner, tips, 0.02)
        rep[side + '_arm_profile'] = prof
    # torso half-width near the armpits: island 0, |y| < 0.10, x-clusters per z band
    T = [V[i] for i in isl[ISL['torso']]]
    bands = {}
    for z0 in (1.20, 1.25, 1.30, 1.35, 1.40, 1.45):
        xs = sorted(p.x for p in T if z0 <= p.z < z0 + 0.05 and abs(p.y) < 0.10)
        cl = []
        for x in xs:
            if cl and x - cl[-1][1] < 0.015:
                cl[-1][1] = x
            else:
                cl.append([x, x])
        bands[f'{z0:.2f}'] = [(round(p, 3), round(q, 3)) for p, q in cl]
    rep['torso_x_clusters'] = bands
    with open(os.path.join(ctx['work'], 's1_sym.json'), 'w') as f:
        json.dump(rep, f, indent=1)
    for kk, vv in rep.items():
        if kk.endswith('profile'):
            print(kk); [print('   ', r) for r in vv]
        else:
            print(kk, vv)
    rb.save(os.path.join(ctx['work'], 's1_sym.blend'))
    rb.append_log(ctx['log'], f"s1 symmetry: arms (islands 14,16) x += {C_BODY}*sm({a:.3f},{b:.3f},|x-c|), "
                              f"whole mesh x -= {C_BODY}; after: legs axis {rep['legs'][0]:+.4f}, arms {rep['arms'][0]:+.4f}, "
                              f"torso {rep['torso'][0]:+.4f}, head {rep['head'][0]:+.4f} (head kept, joints follow it); "
                              f"backup mesh {bk.name} (fake user)")


def _torso_labels(ob, lab):
    """Geodesic Voronoi on the torso island below Z_CAPE_TOP: sources = cape free edge (back part of the long
    boundary loop), scarf free edge (front part of the same loop), tunic hem loop, sleeve openings. The long
    loop is ONE boundary running scarf edge -> cowl -> cape edges, which is why a plain flood leaked (s2 v1)."""
    m = ob.data
    loops = sorted([L for L in rb.boundary_loops(ob) if lab[L[0]] == ISL['torso']], key=lambda L: -len(L))
    big, hem, sl_a, sl_b = loops[0], loops[1], loops[2], loops[3]
    src = {}
    for i in big:
        c = m.vertices[i].co
        if c.z < Z_CAPE_TOP:
            src[i] = 'cape' if c.y > Y_CAPE_SEED else 'scarf'
    for i in hem:
        src[i] = 'hem'
    for L in (sl_a, sl_b):
        side = 'L' if sum(m.vertices[i].co.x for i in L) > 0 else 'R'
        for i in L:
            src[i] = 'sleeve' + side
    allowed = lambda i: lab[i] == ISL['torso'] and m.vertices[i].co.z < Z_CAPE_TOP
    lbl, _ = rb.geodesic_voronoi(ob, src, allowed)
    return lbl, dict(loops=[len(L) for L in loops[:4]], counts=dict(collections.Counter(lbl.values())))


def s2(ctx):
    """Skill stage 2: split into Body / Head / Accessory / Cloth_Robe / Cloth_Cape (user review 2026-10-26:
    the back cape is its own part). U01 has no shoulder capelet, so the skill's 'Cloth' group is empty.
    The torso island is ONE piece (torso, scarf, sleeves, tunic, back cape, side panels): the cape is the
    geodesic-Voronoi region of its free edge, the robe is the rest below the rope band (Z_WAIST); both are
    cut along face boundaries (vertices on a cut are duplicated, weights matched later)."""
    aid = ctx['aid']
    rb.open_blend(os.path.join(ctx['work'], 's1_sym.blend'))
    ob = bpy.data.objects[aid + '_Src']
    keep = ob.data.copy(); keep.name = aid + '_Src_s1'; keep.use_fake_user = True     # pre-split copy
    m = ob.data; lab, isl = rb._islands(ob)
    tl, tinfo = _torso_labels(ob, lab)
    print('torso labels', tinfo)
    ob.data.attributes.new('rb_sleeve', 'INT', 'POINT')
    for i, s_ in tl.items():          # remember sleeve vertices for stage 4 (sleeve chains); 1 = L, 2 = R
        if s_.startswith('sleeve'):
            ob.data.attributes['rb_sleeve'].data[i].value = 1 if s_ == 'sleeveL' else 2
    hair = set(ISL['hair']) | {ISL['coin']}
    labels = []
    for p in m.polygons:
        kk = lab[p.vertices[0]]; cz = sum(m.vertices[i].co.z for i in p.vertices) / len(p.vertices)
        if kk in hair:
            labels.append('Head')
        elif kk == ISL['head']:
            labels.append('Head' if cz >= Z_CHIN else 'Body')
        elif kk in ISL['rope_ends'] or kk == ISL['rope_knot']:
            labels.append('Accessory')
        elif kk == ISL['torso'] and all(tl.get(i) == 'cape' for i in p.vertices):
            labels.append('Cloth_Cape')
        elif kk == ISL['torso'] and cz < Z_WAIST:
            labels.append('Cloth_Robe')
        else:
            labels.append('Body')
    names = {lb: f'{aid}_{lb}' for lb in set(labels)}
    nf0 = len(m.polygons); nv0 = len(m.vertices)
    parts = rb.split_by_face_label(ob, labels, names, 'Body')
    for lb, o in parts.items():
        o['rig_part'] = lb if lb in ('Body', 'Head', 'Accessory') else 'Cloth'
        o['rb_role'] = lb
    rep = dict(faces_before=nf0, verts_before=nv0, z_chin=Z_CHIN, z_waist=Z_WAIST, torso_labels=tinfo,
               parts={lb: dict(faces=len(o.data.polygons), verts=len(o.data.vertices),
                               islands=len(rb._islands(o)[1])) for lb, o in parts.items()})
    rep['faces_after'] = sum(v['faces'] for v in rep['parts'].values())
    rep['verts_after'] = sum(v['verts'] for v in rep['parts'].values())
    seams = rb.seam_pairs(list(parts.values()))
    cnt = collections.Counter(tuple(sorted((a.rsplit('_', 1)[-1], b.rsplit('_', 1)[-1]))) for a, _, b, _ in seams)
    rep['seam_pairs'] = {f'{a}|{b}': n for (a, b), n in cnt.items()}
    print(json.dumps(rep, indent=1))
    with open(os.path.join(ctx['work'], 's2_parts.json'), 'w') as f:
        json.dump(rep, f, indent=1)
    objs = list(parts.values())
    rb.render_parts(os.path.join(ctx['work'], 's2_parts'), objs)
    rb.render_views(os.path.join(ctx['work'], 's2_tex'), objs, views=('front', 'back'), color_type='TEXTURE', res=1000)
    rb.save(os.path.join(ctx['work'], 's2_parts.blend'))
    rb.append_log(ctx['log'], "s2 parts (proposal, waiting for user review): " +
                  ', '.join(f"{lb} {v['faces']}f/{v['verts']}v" for lb, v in rep['parts'].items()) +
                  f"; faces {nf0} -> {rep['faces_after']}; cut seams {rep['seam_pairs']}; chin cut z={Z_CHIN}, waist cut z={Z_WAIST}; "
                  f"cape = geodesic Voronoi of its free edge below z={Z_CAPE_TOP} {tinfo}")


# ---------------------------------------------------------------- stage 3: skeleton + cloth/accessory chains
TORSO_HALF_W = 0.17   # torso side wall under the armpits (z 1.30-1.40 sections, sleeves excluded)
WRIST_X = 0.63        # hand starts widening (arm profile: y-extent 0.049 at x 0.60 -> 0.088 at 0.64)
KNEE_Z = 0.52         # bare knee 0.48-0.60 on the mesh, design: knees at 0.30 of the height (0.513)
# tunic chains over the legs: with F/L/B/R (90 deg apart) the knee pushed at ~35 deg between two chains and
# 13 front vertices stayed inside the thigh on a walk; the legs sit at about +-35 deg front / +-145 deg back
TUNIC_CHAINS = [('FL', 35), ('FR', -35), ('L', 90), ('R', -90), ('BL', 145), ('BR', -145)]
TUNIC_HALF = 20.0
NECK_HALF_W = 0.07    # neck stub half-width (x -0.049..0.094 around 0.022); shoulders sit ABOVE the neck base
LEG_WIN = tuple(float(x) for x in os.environ.get('RB_LEG_WIN', '-0.08,0.05').split(','))   # thigh->calf window (k-scaled)
ARM_MASK_X = 0.12     # Body torso vertices outside this |x| and above ARM_MASK_Z get arm-style weights, blended
ARM_MASK_Z = 1.15     # with torso weights by a harmonic field (no hard edge)


def _arm_axis(P, x0, w=0.012):
    S = [p for p in P if abs(p.x - x0) < w]
    if len(S) < 3:
        return None
    return ((min(p.y for p in S) + max(p.y for p in S)) / 2, (min(p.z for p in S) + max(p.z for p in S)) / 2)


def _rope_chain(points, n=2):
    zt = max(p.z for p in points); zb = min(p.z for p in points)
    def cen(z0, z1):
        S = [p for p in points if z0 <= p.z <= z1]
        return sum(S, rb.Vector()) / len(S)
    t = cen(zt - 0.03, zt); b = cen(zb, zb + 0.03); t.z = zt - 0.01; b.z = zb + 0.01
    return [t.lerp(b, i / n) for i in range(n + 1)]


def landmarks(body, head, robe):
    rc = rb.rc; H = CFG['height_m']
    L = rc.measure_landmarks(body, head, H=H, verbose=True)
    notes = list(L['_notes'])
    # spine y from exact sections of Body + tunic (low-poly: the skill's 1.4 cm vertex slab found only the scarf)
    for key in ('pelvis', 'spine1', 'spine2', 'chest'):
        z = L[key][2]; y, rng = rb.torso_center_y([body, robe], z, 0.06 * H)
        if y is not None:
            notes.append(f'{key} y {L[key][1]:+.3f} -> {y:+.3f} (section y-range {rng})'); L[key] = (0.0, round(y, 4), z)
    # arms: shoulder from the torso wall + 0.02H, wrist where the hand widens, elbow by the skill's ratio
    lab, isl = rb._islands(body); V = [v.co.copy() for v in body.data.vertices]
    armL = max((c for c in isl if min(V[i].x for i in c) > 0.3), key=len); A = [V[i] for i in armL]
    samples = [a for a in (_arm_axis(A, x) for x in (0.44, 0.48, 0.52, 0.56, 0.60)) if a]
    ay = sorted(a[0] for a in samples)[len(samples) // 2]; az = sorted(a[1] for a in samples)[len(samples) // 2]
    sx = TORSO_HALF_W + 0.02 * H; wx = WRIST_X; hx = max(p.x for p in A); ex = sx + rc.PRIOR['elbow_frac'] * (wx - sx)
    def at(x):
        a = _arm_axis(A, x)
        return (round(x, 4), round(a[0] if a else ay, 4), round(a[1] if a else az, 4))
    L['shoulder'] = (round(sx, 4), round(ay + 0.005 * H, 4), round(az, 4)); L['elbow'] = at(ex); L['wrist'] = at(wx)
    L['hand_end'] = (round(hx, 4), L['wrist'][1], round(az - 0.008 * H, 4))
    notes.append(f'arm override: shoulder x {sx:.3f} (torso wall {TORSO_HALF_W} + 0.02H), elbow x {ex:.3f}, wrist x {wx}, hand end {hx:.3f}')
    # neck + head follow the head piece (head axis +0.023 after centring; kept, see s1)
    neck_stub = min((c for c in isl if all(1.40 < V[i].z < 1.52 for i in c)), key=len, default=None)
    hx_axis = rc.mirror_center([v.co.copy() for v in head.data.vertices], lo=-0.05, hi=0.08, step=0.001, cap=0.05)[0]
    nx = hx_axis
    if neck_stub:
        P = [V[i] for i in neck_stub]; nx = (min(p.x for p in P) + max(p.x for p in P)) / 2
    for key, x in (('neck', nx), ('head', hx_axis), ('head_top', hx_axis)):
        L[key] = (round(x, 4), L[key][1], L[key][2])
    notes.append(f'neck x {nx:+.3f}, head x {hx_axis:+.3f} (head piece axis)')
    # clavicle start again with the corrected chest y (skill rule: between chest and neck, 0.014H below the neck base)
    nz = L['neck'][2]
    L['clav_in'] = (round(rc.PRIOR['clav_in_x'] * H, 4), round((L['chest'][1] + L['neck'][1]) / 2, 4),
                    round(nz - rc.PRIOR['clav_in_below_neck'] * H, 4))
    # knees at KNEE_Z, centre of the leg slice there; then the skill's pre-bend + hip-y rules again
    for s, P in ((1, 'L'), (-1, 'R')):
        leg = max((c for c in isl if max(V[i].z for i in c) < 0.9 and s * sum(V[i].x for i in c) > 0), key=len)
        S = [V[i] for i in leg if abs(V[i].z - KNEE_Z) < 0.025]
        L[P + '_knee'] = (round((min(p.x for p in S) + max(p.x for p in S)) / 2, 4),
                          round((min(p.y for p in S) + max(p.y for p in S)) / 2, 4), KNEE_Z)
    hy = (L['L_knee'][1] + L['R_knee'][1]) / 2
    for P in ('L', 'R'):
        x, _, z = L[P + '_hip']; L[P + '_hip'] = (x, round(hy, 4), z)
        a, b, c = (rb.Vector(L[P + kk]) for kk in ('_hip', '_knee', '_ankle'))
        t = (b - a).dot(c - a) / max((c - a).length_squared, 1e-9); d = (b - (a + (c - a) * t)).y
        if d > -0.003 * H:
            x, y, z = L[P + '_knee']; L[P + '_knee'] = (x, round(y - d - 0.003 * H, 4), z)
            notes.append(f'{P} knee pre-bent {100 * (d + 0.003 * H):.1f} cm forward')
    for kk in ('hip', 'knee', 'ankle', 'ball', 'toe'):
        L[kk] = L['L_' + kk]
    notes.append(f'knee z {KNEE_Z} (skill prior {rc.PRIOR["knee_z"] * H:.3f})')
    L['_notes'] = notes
    return L


def s3(ctx):
    """Skill stage 3: body skeleton from measured landmarks (+ U01 overrides), cloth/accessory chains."""
    aid = ctx['aid']; rc = rb.rc; k = rb.K
    rb.open_blend(os.path.join(ctx['work'], 's2_parts.blend'))
    O = {o.get('rb_role'): o for o in bpy.data.objects if o.type == 'MESH' and o.get('rb_role')}
    body, head, acc, robe, cape = O['Body'], O['Head'], O['Accessory'], O['Cloth_Robe'], O['Cloth_Cape']
    L = landmarks(body, head, robe)
    print('final landmarks:')
    for kk in L:
        if not kk.startswith('_'):
            print('  ', kk, L[kk])
    for n in L['_notes']:
        print('  note:', n)
    rig = rb.build_skeleton(aid + '_Rig', L, k)
    chains = {}
    yc = L['pelvis'][1]
    R = [v.co.copy() for v in robe.data.vertices]
    for tag, a0 in TUNIC_CHAINS:
        pts = rb.sector_chain(R, a0, (0.0, yc), half=TUNIC_HALF, n=3)
        chains[f'robe_tunic_{tag}'] = rc.add_chain(rig, f'robe_tunic_{tag}', pts, 'pelvis')
    C = [v.co.copy() for v in cape.data.vertices]; cy = -0.05 * k
    for tag, a0, par in (('B', 180, 'chest'), ('L', 120, 'chest'), ('R', -120, 'chest')):    # v1 had L/R on the clavicles: a shrug swung the 80 cm panels (2x tear vs the back chain)
        pts = rb.sector_chain(C, a0, (0.0, cy), half=20, n=3)
        chains[f'robe_cape_{tag}'] = rc.add_chain(rig, f'robe_cape_{tag}', pts, par)
    # sleeve flaps (Body vertices labelled in s2), hanging under each upper arm
    sl = body.data.attributes['rb_sleeve']
    for val, P in ((1, 'L'), (2, 'R')):
        F = [body.data.vertices[i].co.copy() for i in range(len(body.data.vertices))
             if sl.data[i].value == val and body.data.vertices[i].co.z < 1.45]
        top = [p for p in F if p.z > 1.40]; t = sum(top, rb.Vector()) / len(top); t.z = 1.44
        zb = min(p.z for p in F); low = [p for p in F if p.z < zb + 0.05]; b = sum(low, rb.Vector()) / len(low); b.z = zb + 0.02
        chains[f'sleeve_{P}'] = rc.add_chain(rig, f'sleeve_{P}', [t, t.lerp(b, 0.5), b], f'{P}_UpperArm')
    # rope ends (Accessory islands hanging below the knot)
    alab, aisl = rb._islands(acc); AV = [v.co.copy() for v in acc.data.vertices]
    ends = sorted([c for c in aisl if max(AV[i].z for i in c) - min(AV[i].z for i in c) > 0.15],
                  key=lambda c: -sum(AV[i].x for i in c) / len(c))
    ra = acc.data.attributes.get('rb_rope') or acc.data.attributes.new('rb_rope', 'INT', 'POINT')
    for val, (P, c) in enumerate(zip(('L', 'R'), ends), start=1):
        chains[f'flap_rope_{P}'] = rc.add_chain(rig, f'flap_rope_{P}', _rope_chain([AV[i] for i in c]), 'spine_01')
        for i in c:
            ra.data[i].value = val          # s4 reads which rope island belongs to which chain
    rig['rb_chains'] = json.dumps(chains)
    rig['rb_landmarks'] = json.dumps({kk: v for kk, v in L.items() if not kk.startswith('_')})
    # joints edited by the user in the rig editor (tools/rig_editor 'Luu' -> <blend>_<Rig>_joints.json)
    ej = os.environ.get('RB_EDITOR_JOINTS')
    if ej:
        with open(ej, encoding='utf-8') as f:
            J = json.load(f).get('joints')
        before = {kk: v.copy() for kk, v in rc.rig_joints(rig).items()}
        rc.apply_joints(rig, J)
        after = rc.rig_joints(rig)
        moved = {kk: round((after[kk] - before[kk]).length * 100, 2) for kk in after if kk in before and (after[kk] - before[kk]).length > 1e-4}
        L['_notes'].append(f'editor joints {os.path.basename(ej)}: moved (cm) {moved}')
        rig['rb_editor_joints'] = json.dumps({'file': ej, 'moved_cm': moved})
        lm = json.loads(rig['rb_landmarks'])
        for kk in ('pelvis', 'spine1', 'spine2', 'chest', 'neck', 'head', 'head_top'):
            if kk in after:
                lm[kk] = list(after[kk])
        rig['rb_landmarks'] = json.dumps(lm)
        print('editor joints applied, moved cm:', moved)
    for o in (body, head, acc, robe, cape):
        rc.bind(o, rig)
    rep = dict(bones=len(rig.data.bones), deform=sum(1 for b in rig.data.bones if b.use_deform),
               chains={n: len(v) for n, v in chains.items()}, notes=L['_notes'], lengths=rb.bone_lengths(rig))
    with open(os.path.join(ctx['work'], 's3_skeleton.json'), 'w') as f:
        json.dump(rep, f, indent=1)
    proxy = rb.bone_proxy(rig, posed=False)
    meshes = [body, head, acc, robe, cape]
    rb.render_views(os.path.join(ctx['work'], 's3_xray'), meshes, views=('front', 'left', 'back'), color_type='TEXTURE',
                    res=1100, xray=True, bones=proxy, bone_xray_alpha=0.35)
    hc = rb.Vector((0.02, -0.06, 1.47))
    for v in ('front', 'left'):
        rb.render_closeup(os.path.join(ctx['work'], f's3_neck_{v}.png'), meshes, hc, 0.5, v, xray=True, alpha=0.35)
        rb.render_closeup(os.path.join(ctx['work'], f's3_neck_{v}_bones.png'), [proxy], hc, 0.5, v, color_type='VERTEX')
    bpy.data.objects.remove(proxy)
    rb.save(os.path.join(ctx['work'], 's3_skeleton.blend'))
    rb.append_log(ctx['log'], f"s3 skeleton: {rep['bones']} bones ({rep['deform']} deform), chains {rep['chains']}; notes: "
                  + ' | '.join(L['_notes']))



# ---------------------------------------------------------------- stage 4: weights
def _parts():
    O = {o.get('rb_role'): o for o in bpy.data.objects if o.type == 'MESH' and o.get('rb_role')}
    return O['Body'], O['Head'], O['Accessory'], O['Cloth_Robe'], O['Cloth_Cape']


def s4(ctx):
    """Skill stage 4 + cloth weights of stage 5. Head = head 100 %. Body from the joints (skill body_weights,
    k-scaled) with neck skin harmonic from the chin cut and sleeve flaps blended arm -> sleeve chain.
    Accessory: knot follows the skin, rope ends on their chains (parent by the skill's hook rule).
    Robe / Cape: two nearest chains by angle, and a 10 cm band at each cut seam blended to the Body twin."""
    aid = ctx['aid']; rc = rb.rc; k = rb.K
    rb.NECK_HALF_W = NECK_HALF_W; rb.LEG_WIN = LEG_WIN
    rb.open_blend(os.path.join(ctx['work'], 's3_skeleton.blend'))
    body, head, acc, robe, cape = _parts()
    rig = bpy.data.objects[aid + '_Rig']; chains = json.loads(rig['rb_chains']); B = rig.data.bones
    rep = {}
    # Head
    for v in head.data.vertices:
        rc.set_weights(head, v.index, {'head': 1.0})
    rc.finalize_weights(head)
    # Body
    skin = rb.neck_skin_from_cut(body, head)
    rep['neck_skin_verts'] = len(skin)
    lab, isl = rb._islands(body); V = body.data.vertices; sl = body.data.attributes['rb_sleeve']
    torso = max(range(len(isl)), key=lambda kk: len(isl[kk]))
    arm_isl = {kk for kk, c in enumerate(isl) if min(abs(V[i].co.x) for i in c) > 0.3 and len(c) > 100}
    # shoulder caps + sleeves + upper flanks: the skill's shoulder window (by |x|) blends torso -> arm, so the
    # mask must not have a hard edge of its own (v1 cut at z 1.42 tore 21x on arms_down)
    def is_arm(i):
        return lab[i] in arm_isl or sl.data[i].value != 0 or (lab[i] == torso and abs(V[i].co.x) > ARM_MASK_X and V[i].co.z > ARM_MASK_Z)
    arm_mask = [i for i in range(len(V)) if is_arm(i)]
    rc.body_weights(body, rig, is_arm, keep=skin)
    rc.store_mask(body, 'rig_arm', arm_mask)
    rep['arm_mask'] = len(arm_mask)
    # no hard mask edge: blend torso <-> arm-style weights by a harmonic field over the shoulder region
    band = [i for i in arm_mask if lab[i] == torso and i not in skin]
    # anchors that follow the arm fully: sleeves, anything far out, and the SHOULDER CAPS (8 cm past the shoulder
    # joint, above the armpit). v1 anchored only |x|>0.40 + sleeves: the back shoulder corners (|x| 0.30-0.37) are
    # neither, the harmonic field fell to ~0 there and 148 vertices stayed up in T-pose when the arms went down.
    shj = B['L_UpperArm'].head_local
    cdx, cdz = (float(x) for x in os.environ.get('RB_CAP', '0.12,0.04').split(','))
    cap_x, cap_z = abs(shj.x) + cdx * k, shj.z - cdz * k
    ones = [i for i in band if abs(V[i].co.x) > 0.40 or (sl.data[i].value != 0 and abs(V[i].co.x) > 0.30)
            or (abs(V[i].co.x) > cap_x and V[i].co.z > cap_z)]
    zeros = [i for i in band if abs(V[i].co.x) < ARM_MASK_X + 0.02 or V[i].co.z < ARM_MASK_Z + 0.03]
    rb.smooth_arm_blend(body, rig, band, ones, zeros)
    rep['arm_blend'] = dict(band=len(band), ones=len(ones), zeros=len(zeros))
    nflap = 0
    for val, P in ((1, 'L'), (2, 'R')):
        bones = chains[f'sleeve_{P}']; jz = rb.chain_joint_z(rig, bones); za = B[f'{P}_UpperArm'].head_local.z
        for i in range(len(V)):
            if sl.data[i].value != val:
                continue
            z = V[i].co.z; s_ = rc.sm(za - 0.06 * k, za - 0.16 * k, z)     # v1 (-0.04/-0.12) squashed 10x under the dangle
            if s_ <= 0:
                continue
            cw = rc.chain_weights(bones, jz, z, blend=0.04 * k)
            rc.set_weights(body, i, rb.blend(rb.vertex_weights(body, i), cw, s_)); nflap += 1
    rc.finalize_weights(body)
    rep['sleeve_flap_verts'] = nflap
    # Accessory: knot follows the skin; rope ends on their chains, top 4 cm blended to the skin
    alab, aisl = rb._islands(acc); AV = acc.data.vertices
    knot = [c for c in aisl if max(AV[i].co.z for i in c) - min(AV[i].co.z for i in c) < 0.15]
    knot_verts = [i for c in knot for i in c]
    rc.follow_skin(acc, body, knot_verts); rc.store_mask(acc, 'rig_follow_skin', knot_verts)
    # the knot is one rigid lump: per-vertex skin weights (the waist changes spine_01 -> spine_02 within its 7 cm)
    # squashed it 3.6x on a twist; give every knot vertex the average of its follow-skin weights
    avg = collections.Counter()
    for i in knot_verts:
        for n, x in rb.vertex_weights(acc, i).items():
            avg[n] += x / len(knot_verts)
    top4 = dict(avg.most_common(4))
    for i in knot_verts:
        rc.set_weights(acc, i, top4)
    kd = rb.kdtree.KDTree(len(V))
    for v in V:
        kd.insert(v.co, v.index)
    kd.balance()
    for P in ('L', 'R'):
        bones = chains[f'flap_rope_{P}']; jz = rb.chain_joint_z(rig, bones)
        hp = B[bones[0]].head_local.copy(); par = rb.hook_parent(rig, body, hp); rb.reparent(rig, bones[0], par)
        rep[f'flap_rope_{P}_parent'] = par
        ra = acc.data.attributes['rb_rope']; val = 1 if P == 'L' else 2       # rope island of this chain (s3)
        c = [i for i in range(len(AV)) if ra.data[i].value == val]
        zt = max(AV[i].co.z for i in c)
        for i in c:
            z = AV[i].co.z; cw = rc.chain_weights(bones, jz, z, blend=0.03 * k)
            s_ = rc.sm(zt - 0.005, zt - 0.04 * k, z)
            rc.set_weights(acc, i, rb.blend({par: 1.0}, cw, s_))     # top under the knot: the hook bone itself
    rc.finalize_weights(acc)
    # cloth parts
    lm = json.loads(rig['rb_landmarks'])
    specs = ((robe, {n: chains[n] for n in chains if n.startswith('robe_tunic_')},
              {f'robe_tunic_{t}': a for t, a in TUNIC_CHAINS}, (0.0, lm['pelvis'][1])),
             (cape, {n: chains[n] for n in chains if n.startswith('robe_cape_')},
              {'robe_cape_B': 180, 'robe_cape_L': 120, 'robe_cape_R': -120}, (0.0, -0.05 * k)))
    for ob, ch, ang, cen in specs:
        band = rb.seam_band(ob, body, 0.10 * k)
        for v in ob.data.vertices:
            d = rb.angular_chain_weights(v.co, rig, ch, ang, cen, blend_z=0.06 * k)
            if v.index in band:
                j, s_ = band[v.index]; d = rb.blend(rb.vertex_weights(body, j), d, s_)
            rc.set_weights(ob, v.index, d)
        rc.finalize_weights(ob)
        rep[ob.name + '_seam_band'] = len(band)
    rep['health'] = rb.health_all([body, head, acc, robe, cape], rig)
    print(json.dumps(rep, indent=1))
    with open(os.path.join(ctx['work'], 's4_weights.json'), 'w') as f:
        json.dump(rep, f, indent=1)
    # weight colour renders
    objs = [body, head, acc, robe, cape]
    for o in objs:
        rb.set_point_colors(o, rb.weight_colors(o))
    rb.render_views(os.path.join(ctx['work'], 's4_wcol'), objs, views=('front', 'back', 'left', 'three_quarter'),
                    color_type='VERTEX', res=1000)
    for o in objs:
        rb.clear_point_colors(o)
    rb.save(os.path.join(ctx['work'], 's4_weights.blend'))
    h = rep['health']
    rb.append_log(ctx['log'], f"s4 weights: neck skin {rep['neck_skin_verts']} verts (harmonic from the chin cut), arm mask {rep['arm_mask']}, "
                  f"sleeve flaps {nflap}, rope parents {rep['flap_rope_L_parent']}/{rep['flap_rope_R_parent']}; health "
                  + '; '.join(f"{n.rsplit('_', 1)[-1]} maxinf {v['max_influences']} notnorm {v['not_normalised']} empty {v['empty']} nondeform {v['on_non_deform']}" for n, v in h.items()))



# ---------------------------------------------------------------- stage 5: push mechanism + QA poses
QA_RENDER = ('walk', 'arms_down', 'elbows', 'bend', 'twist', 'head_turn', 'kick', 'sit')


PUSH_KW = dict(iters=6, smooth=0.7, rounds=6)   # best of 5 settings on the 6-chain tunic (walk/step/knee/side 0 pen)


def s5(ctx):
    """Skill stage 5 (cloth push) + QA: leg colliders measured on the mesh, push data + live F3 script in
    the file (no collider wireframes, no baked demo - skill default), test poses with numbers and renders."""
    aid = ctx['aid']; rc = rb.rc; k = rb.K
    rb.PUSH_KW = PUSH_KW
    rb.open_blend(os.path.join(ctx['work'], 's4_weights.blend'))
    body, head, acc, robe, cape = _parts(); meshes = [body, head, acc, robe, cape]
    rig = bpy.data.objects[aid + '_Rig']; chains = json.loads(rig['rb_chains'])
    radii = rb.leg_radii(rig, body)
    print('leg radii', radii)
    P = rb.push_setup(rig, [robe, cape, acc], radii, layer_cap=0.4, skip=('beads', 'flap_rope'))
    rc.write_push_data(P); rc.install_live_script()
    rep = dict(radii=radii, chains=P['chains'], layer_pairs=[(P['chains'][a][0], P['chains'][b][0]) for a, b in P['layers']['pairs']],
               layer_contacts=len(P['layers']['contacts']), transferred=P['transferred'],
               neighbors={P['chains'][a][0]: sorted(P['chains'][b][0] for b in v) for a, v in P['neighbors'].items()})
    rep['rest_push_deg'] = rb.max_rest_push_deg(rig, P)
    rep['push_kw'] = PUSH_KW
    rig['rb_push_kw'] = json.dumps(PUSH_KW)
    rep['health'] = rb.health_all(meshes, rig)
    dch = [chains['sleeve_L'], chains['sleeve_R']]
    rep['poses'] = rb.qa_poses(meshes, rig, P, dangle_chains=dch, render=QA_RENDER,
                               out_prefix=os.path.join(ctx['work'], 's5_qa'), views=('front', 'left'), res=800)
    for n, r in rep['poses'].items():
        print(f"{n:10s} stretch {r['stretch']:5.2f} bad {r['bad_edges']:4d}  pen {r.get('pen_nopush', '-')}->{r.get('pen', '-')}  "
              f"seams max {1000 * r['seams']['max']:.1f} mm >2mm {r['seams']['over2mm']}  "
              + ' '.join(f"{kk}:{v[0]}/{v[1]}/{v[2]}mm" for kk, v in r['per_part'].items() if v[0] > 1.0))
    print('rest push deg', rep['rest_push_deg'], 'layers', rep['layer_pairs'], 'transferred', rep['transferred'])
    with open(os.path.join(ctx['work'], 's5_qa.json'), 'w') as f:
        json.dump(rep, f, indent=1, default=str)
    rb.save(os.path.join(ctx['work'], 's5_rig.blend'))



# ---------------------------------------------------------------- stage 6: package for G2
def s6(ctx):
    """R4/R5 package: final .blend in rig/, validation.json, QA renders in rig/qa/ (sheets composed outside)."""
    import shutil, glob, platform
    aid = ctx['aid']; rc = rb.rc
    rb.open_blend(os.path.join(ctx['work'], 's5_rig.blend'))
    body, head, acc, robe, cape = _parts(); meshes = [body, head, acc, robe, cape]
    rig = bpy.data.objects[aid + '_Rig']
    q = ctx['qa']
    rb.xray_views(os.path.join(q, f'{aid}_xray'), meshes, rig)
    proxy = rb.bone_proxy(rig, posed=False); hc = rb.Vector((0.02, -0.06, 1.47))
    for v in ('front', 'left'):
        rb.render_closeup(os.path.join(q, f'{aid}_neck_{v}.png'), meshes, hc, 0.5, v, color_type='TEXTURE', xray=True, alpha=0.35)
        rb.render_closeup(os.path.join(q, f'{aid}_neck_{v}_bones.png'), [proxy], hc, 0.5, v, color_type='VERTEX')
    bpy.data.objects.remove(proxy)
    for f in glob.glob(os.path.join(ctx['work'], 's4_wcol_*.png')) + glob.glob(os.path.join(ctx['work'], 's5_qa_*.png')):
        if not f.endswith('_cam.json'):
            shutil.copy(f, os.path.join(q, f'{aid}_' + os.path.basename(f)))
    s2 = json.load(open(os.path.join(ctx['work'], 's2_parts.json')))
    s3 = json.load(open(os.path.join(ctx['work'], 's3_skeleton.json')))
    s4 = json.load(open(os.path.join(ctx['work'], 's4_weights.json')))
    s5 = json.load(open(os.path.join(ctx['work'], 's5_qa.json')))
    intake = json.loads(bpy.data.objects.get(aid + '_Body').get('rb_intake', '{}')) if False else None
    B = rig.data.bones
    val = dict(asset=aid, date='2026-10-26', blender=bpy.app.version_string, height_m=CFG['height_m'], k=rb.K,
               glb_sha256=json.load(open(os.path.join(ctx['work'], 's0_islands.json')))['sha256'],
               bones=len(B), deform=sum(1 for b in B if b.use_deform),
               non_deform=sorted(b.name for b in B if not b.use_deform),
               chains=json.loads(rig['rb_chains']), landmarks=json.loads(rig['rb_landmarks']),
               parts=s2['parts'], seam_pairs=s2['seam_pairs'], skeleton_notes=s3['notes'],
               weights=dict(neck_skin=s4['neck_skin_verts'], arm_mask=s4['arm_mask'], sleeve_flaps=s4['sleeve_flap_verts']),
               health=s5['health'], leg_radii=s5['radii'], push_kw=s5.get('push_kw'), rest_push_deg=s5['rest_push_deg'],
               layer_pairs=s5['layer_pairs'], poses=s5['poses'],
               reference_skill_rig=dict(arms_down='4.3x/24', elbows='4.1x/35', walk='3.6x/18', knees='3.1x/4',
                                        head_turn_neck_head='1.8x/5', pen_after_push=dict(walk=3, kick=4, step_back=5, sit=8, knees=4, side_step=2)),
               tools=dict(skill='~/.claude/skills/blender-character-rigging/scripts/rig_core.py (unmodified)',
                          batch='ashlar/3d/act-01/_batches/rig_v1/tools/ (rigbatch.py, assets/U01_shambler.py, run_stage.py)'))
    with open(os.path.join(ctx['rigdir'], 'validation.json'), 'w', encoding='utf-8') as f:
        json.dump(val, f, indent=1, default=str)
    rb.tidy_for_user(rig)
    rb.save(os.path.join(ctx['rigdir'], f'{aid}_rig.blend'))
