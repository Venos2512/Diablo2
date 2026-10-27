"""Generic rig_v1 stages (skill 'blender-character-rigging' stages 1-5 + packaging), driven by an asset module.

The asset module (tools/assets/<AID>.py) defines HEIGHT_M and the data below; optional hooks override defaults.
Everything here was first written and tuned on the pilot U01 Shambler (G2 approved 2026-10-26) and then
generalised; numbers in comments refer to that pilot.

Asset module fields
  HEIGHT_M          catalogue height (m), rig at real height (G1)
  ISL               dict of named island ids (stage-0 numbering, importer weld): used by the rules below
  SYM               dict(c=body axis x, ops=[('ramp', [island ids], shift, a, b), ...], center=True)
                    ramp: x += shift*sm(a*k, b*k, |x-c|) on those islands; then everything x -= c if center
  HEAD              dict(islands=[...] all to Head, cut=[...] cut at z_chin, z_chin=..., pred=f(face centre),
                    in_body=True: joined back into Body at the end of s4)
  ROBE_CUTS         {label: dict(islands=[...], z_max=...)}   faces of those islands below z_max -> label
  CLOTH_ISL         {label: [islands]}                         whole islands -> label (robe parts)
  DELETE_ISL        [islands]                                 stage-0 islands removed in s2 (user mesh clean-up)
  ACC               {name: dict(islands=[...], mode='follow'|'follow_uniform'|'rigid'|'strand', n=2, parent=None)}
  CLOTH             {label: dict(prefix=..., chains=[(tag, angle)], half=20, n=3, parent='pelvis', center='pelvis'|(x,y))}
  SLEEVES           None or dict(z_top=..., z_bottom_pad=0.02) (needs the rb_sleeve attribute from a hook)
  LM                landmark overrides: torso_half_w, wrist_x, knee_z, head_axis(bool), neck_half_w, leg_win, arm_mask_x,
                    arm_mask_z, cap=(dx, dz), arms_from (island ids of the L arm for the axis) ...
  PUSH_KW           skirt push options
Hooks (optional): s2_labels(ob, lab, isl, info) -> per-face labels or None; s2_attrs(ob, lab, isl, info);
  landmarks_fix(L, parts); extra_chains(rig, parts, chains); is_arm(i, ...);
  arm_band(body, rig, band, ones, zeros, rep) -> (ones, zeros) for the shoulder blend (s4, before smooth_arm_blend);
  body_weights_fix(body, rig, rep) (s4, after the head band); cloth_weights_fix(parts, rig, chains, rep) (s4)
"""
import bpy, os, json, math, collections, glob, shutil
import rigbatch as rb


def P(A, name, default=None):
    return getattr(A, name, default)


def LMv(A, key, default=None):
    ov = json.loads(os.environ.get('RB_LM_OVERRIDE', '{}'))      # sweeps: RB_LM_OVERRIDE='{"head_band": 0.08}'
    if key in ov:
        return ov[key]
    return (P(A, 'LM', {}) or {}).get(key, default)


def parts_by_role():
    return {o.get('rb_role'): o for o in bpy.data.objects if o.type == 'MESH' and o.get('rb_role')}


def ordered_parts():
    O = parts_by_role()
    order = ['Body', 'Head', 'Accessory'] + sorted(k for k in O if k.startswith('Cloth'))
    return [O[k] for k in order if k in O]


# ================================================================== s1 symmetry
def s1(ctx, A):
    rc = rb.rc; k = rb.K; aid = ctx['aid']
    rb.open_blend(os.path.join(ctx['work'], 's0_intake.blend'))
    ob = bpy.data.objects[aid + '_Src']
    bk = ob.data.copy(); bk.name = aid + '_Src_backup'; bk.use_fake_user = True
    lab, isl = rb._islands(ob)
    sym = P(A, 'SYM', {}) or {}
    c = sym.get('c', 0.0); done = []
    for op in sym.get('ops', []):
        m = ob.data
        if op[0] in ('ramp', 'ramp_z'):
            ids, shift, a, b = op[1:5]
            z0, z1 = (op[5], op[6]) if op[0] == 'ramp_z' else (None, None)
            vs = [i for kk in ids for i in isl[kk]]
            for i in vs:
                co = m.vertices[i].co
                f = rc.sm(a * k, b * k, abs(co.x - c))
                if z0 is not None:
                    f *= rc.sm(z0, z1, co.z)            # only the arm band of a fused body (U05: not the belly)
                co.x += shift * f
            done.append(f'{op[0]} islands {ids} shift {shift:+.4f} sm({a * k:.3f},{b * k:.3f},|x-{c:+.3f}|)' + (f' z {z0}-{z1}' if z0 else ''))
        elif op[0] == 'shift':
            ids, dx = op[1], op[2]
            for kk in ids:
                for i in isl[kk]:
                    m.vertices[i].co.x += dx
            done.append(f'shift islands {ids} x += {dx:+.4f}')
    if sym.get('center', True) and abs(c) > 1e-6:
        for v in ob.data.vertices:
            v.co.x -= c
        done.append(f'all x -= {c:+.4f}')
    ob.data.update()
    ob['rb_fix'] = json.dumps(dict(c=c, ops=[list(map(str, o)) for o in sym.get('ops', [])], center=sym.get('center', True)))
    print('after fix:')
    rep = dict(ops=done, sym={n: [round(cc, 4), round(e, 4)] for n, (cc, e) in rc.symmetry_report(ob).items()})
    V = [v.co.copy() for v in ob.data.vertices]
    for name, ids in (P(A, 'ISL', {}) or {}).items():
        if isinstance(ids, int):
            ids = [ids]
        if name in ('legs', 'arms', 'torso', 'head', 'hands', 'feet') and ids:
            Pts = [V[i] for kk in ids for i in isl[kk]]
            rep[name + '_axis'] = [round(x, 4) for x in rc.mirror_center(Pts, lo=-0.08 * k, hi=0.08 * k, step=0.001, cap=0.05 * k)]
    print(json.dumps(rep, indent=1))
    with open(os.path.join(ctx['work'], 's1_sym.json'), 'w') as f:
        json.dump(rep, f, indent=1)
    rb.save(os.path.join(ctx['work'], 's1_sym.blend'))
    rb.append_log(ctx['log'], f"s1 symmetry: {'; '.join(done) or 'no change'}; after {rep['sym']}; backup mesh {bk.name} (fake user)")


# ================================================================== s2 parts
INBODY_FACES = {}


def inbody_code(A, label):
    return list((P(A, 'CLOTH', {}) or {}).keys()).index(label) + 1


def inbody_labels(A):
    return [cl for cl, spec in (P(A, 'ROBE_CUTS', {}) or {}).items() if spec.get('in_body')]


def default_labels(A, ob, lab, isl):
    m = ob.data
    head = P(A, 'HEAD', {}) or {}
    head_all = set(head.get('islands', [])); head_cut = set(head.get('cut', [])); zc = head.get('z_chin', 1e9)
    acc = set(i for spec in (P(A, 'ACC', {}) or {}).values() for i in spec['islands'])
    cl_isl = {i: lb for lb, ids in (P(A, 'CLOTH_ISL', {}) or {}).items() for i in ids}
    cuts = P(A, 'ROBE_CUTS', {}) or {}
    body_isl = {i for v in (P(A, 'ISL', {}) or {}).values() for i in v}     # named torso/leg/arm islands stay Body
    inbody = {cl for cl, spec in cuts.items() if spec.get('in_body')}
    cut_labels = set(cuts); sla = m.attributes.get('rb_sleeve')
    INBODY_FACES.clear()
    labels = []
    for p in m.polygons:
        kk = lab[p.vertices[0]]; cz = sum(m.vertices[i].co.z for i in p.vertices) / len(p.vertices)
        lb = None
        if kk in head_all:
            lb = 'Head'
        elif kk in head_cut and cz >= zc and (head.get('pred') is None or
                                               head['pred'](sum((m.vertices[i].co for i in p.vertices), rb.Vector()) / len(p.vertices))):
            lb = 'Head'
        elif kk in acc:
            lb = 'Accessory'
        elif kk in cl_isl:
            lb = cl_isl[kk]
        else:
            for cl, spec in cuts.items():
                ab = spec.get('absorb_small')     # small loose islands sitting on the cut cloth (patches, seams) go with it
                if ab and kk not in spec['islands'] and kk not in body_isl and len(isl[kk]) <= ab and cz < spec['z_max']:
                    c3 = sum((m.vertices[i].co for i in p.vertices), rb.Vector()) / len(p.vertices)
                    if spec.get('pred') is None or spec['pred'](c3):
                        lb = cl; break
                if kk in spec['islands'] and cz < spec['z_max']:
                    c3 = sum((m.vertices[i].co for i in p.vertices), rb.Vector()) / len(p.vertices)
                    if spec.get('x_max') is not None and abs(c3.x) >= spec['x_max']:
                        continue
                    if spec.get('pred') is not None and not spec['pred'](c3):
                        continue
                    lb = cl; break
        if lb and lb in cut_labels and sla is not None and all(sla.data[i].value != 0 for i in p.vertices):
            lb = None                      # sleeve faces never become cloth (P05 rags reach the cut line)
        if lb in inbody:                   # cloth kept inside the Body mesh (user: no separate part): remember its faces
            INBODY_FACES.setdefault(lb, []).append(p.index); lb = 'Body'
        labels.append(lb or 'Body')
    return labels


def s2(ctx, A):
    aid = ctx['aid']
    rb.open_blend(os.path.join(ctx['work'], 's1_sym.blend'))
    ob = bpy.data.objects[aid + '_Src']
    keep = ob.data.copy(); keep.name = aid + '_Src_s1'; keep.use_fake_user = True
    lab, isl = rb._islands(ob); info = {}
    ai = ob.data.attributes.get('rb_isl') or ob.data.attributes.new('rb_isl', 'INT', 'POINT')     # stage-0 island id, kept by every part
    for i, kk in enumerate(lab):
        ai.data[i].value = kk
    sg = P(A, 'SLEEVE_GEO')
    if sg:                                  # sleeve flaps by position: beyond x_min, between z_min and z_max, in the given islands
        a = ob.data.attributes.get('rb_sleeve') or ob.data.attributes.new('rb_sleeve', 'INT', 'POINT')
        ids = set(sg['islands']); n = 0
        for v in ob.data.vertices:
            co = v.co
            if lab[v.index] in ids and abs(co.x) > sg['x_min'] and sg['z_min'] < co.z < sg['z_max']:
                a.data[v.index].value = 1 if co.x > 0 else 2; n += 1
        info['sleeve_geo_verts'] = n
    if P(A, 's2_attrs'):
        A.s2_attrs(ob, lab, isl, info)
    # accessory item codes (stage 3/4 build bones and weights per item)
    accs = P(A, 'ACC', {}) or {}
    if accs:
        at = ob.data.attributes.get('rb_acc') or ob.data.attributes.new('rb_acc', 'INT', 'POINT')
        for code, (name, spec) in enumerate(accs.items(), start=1):
            for kk in spec['islands']:
                for i in isl[kk]:
                    at.data[i].value = code
        info['acc_codes'] = {name: code for code, name in enumerate(accs, start=1)}
    labels = (A.s2_labels(ob, lab, isl, info) if P(A, 's2_labels') else None) or default_labels(A, ob, lab, isl)
    if INBODY_FACES:
        ac = ob.data.attributes.get('rb_cloth') or ob.data.attributes.new('rb_cloth', 'INT', 'POINT')
        for lb, fs in INBODY_FACES.items():
            code = inbody_code(A, lb)
            for fi in fs:
                for vi in ob.data.polygons[fi].vertices:
                    ac.data[vi].value = code
        info['in_body_cloth'] = {lb: len(fs) for lb, fs in INBODY_FACES.items()}
    names = {lb: f'{aid}_{lb}' for lb in set(labels)}
    nf0 = len(ob.data.polygons); nv0 = len(ob.data.vertices)
    parts = rb.split_by_face_label(ob, labels, names, 'Body')
    dl = set(P(A, 'DELETE_ISL', []) or [])          # stage-0 islands the user deleted by hand (U03: ties at the crotch)
    if dl:
        import bmesh
        for o in parts.values():
            ai_ = o.data.attributes.get('rb_isl')
            if ai_ is None:
                continue
            bm = bmesh.new(); bm.from_mesh(o.data); lay = bm.verts.layers.int.get('rb_isl')
            gone = [v for v in bm.verts if v[lay] in dl]
            if gone:
                bmesh.ops.delete(bm, geom=gone, context='VERTS'); bm.to_mesh(o.data)
                info.setdefault('deleted_verts', {})[o.name] = len(gone)
            bm.free()
    for lb, o in parts.items():
        o['rig_part'] = lb if lb in ('Body', 'Head', 'Accessory') else 'Cloth'
        o['rb_role'] = lb
    dz = (sg or {}).get('detach_z')
    if dz is not None and 'Body' in parts:
        info['sleeve_detach'] = detach_sleeves(parts['Body'], dz * rb.K)
    rep = dict(faces_before=nf0, verts_before=nv0, info={k_: v for k_, v in info.items() if k_ != 'labels'},
               parts={lb: dict(faces=len(o.data.polygons), verts=len(o.data.vertices), islands=len(rb._islands(o)[1]))
                      for lb, o in parts.items()})
    rep['faces_after'] = sum(v['faces'] for v in rep['parts'].values())
    seams = rb.seam_pairs(list(parts.values()))
    cnt = collections.Counter(tuple(sorted((a.split(aid + '_', 1)[-1], b.split(aid + '_', 1)[-1]))) for a, _, b, _ in seams)
    rep['seam_pairs'] = {f'{a}|{b}': n for (a, b), n in cnt.items()}
    print(json.dumps(rep, indent=1, default=str))
    with open(os.path.join(ctx['work'], 's2_parts.json'), 'w') as f:
        json.dump(rep, f, indent=1, default=str)
    objs = list(parts.values())
    rb.render_parts(os.path.join(ctx['work'], 's2_parts'), objs)
    rb.render_views(os.path.join(ctx['work'], 's2_tex'), objs, views=('front', 'back'), color_type='TEXTURE', res=1000)
    rb.save(os.path.join(ctx['work'], 's2_parts.blend'))
    rb.append_log(ctx['log'], "s2 parts (proposal): " + ', '.join(f"{lb} {v['faces']}f/{v['verts']}v" for lb, v in rep['parts'].items())
                  + f"; faces {nf0} -> {rep['faces_after']}; cut seams {rep['seam_pairs']}")


def detach_sleeves(body, z_max):
    """Hanging sleeves fused to the hip (P01): split the edges between sleeve faces (all vertices rb_sleeve != 0) and
    other faces below z_max, then clear rb_sleeve on the copies that ended up on the non-sleeve side. Without it the
    sleeve tip and the hip share vertices and tear 25-29x whenever the arm moves."""
    import bmesh
    m = body.data; bm = bmesh.new(); bm.from_mesh(m)
    lay = bm.verts.layers.int.get('rb_sleeve')
    is_sl = lambda f: any(v[lay] != 0 for v in f.verts)     # faces straddling the label edge go with the sleeve
    cut = [e for e in bm.edges if len(e.link_faces) == 2 and is_sl(e.link_faces[0]) != is_sl(e.link_faces[1])
           and (e.verts[0].co.z + e.verts[1].co.z) / 2 < z_max]
    bmesh.ops.split_edges(bm, edges=cut)
    sl_faces = {f.index for f in bm.faces if is_sl(f)}      # classify once: the relabel below must not change it
    cleared = added = 0
    for v in bm.verts:
        fs = [f.index in sl_faces for f in v.link_faces]
        if not fs:
            continue
        if v[lay] != 0 and not any(fs):
            v[lay] = 0; cleared += 1
        elif v[lay] == 0 and all(fs) and v.co.z < z_max:      # sleeve-side copy of a boundary vertex
            v[lay] = 1 if v.co.x > 0 else 2; added += 1
    lc = bm.verts.layers.int.get('rb_cloth')
    if lc is not None:                                         # the sleeve side is never skirt cloth
        for v in bm.verts:
            if v[lay] != 0:
                v[lc] = 0
    bm.to_mesh(m); bm.free(); m.update()
    return dict(edges=len(cut), cleared=cleared, added=added)


# ================================================================== s3 skeleton
def _axis_at(Pts, x0, w=0.012):
    S = [p for p in Pts if abs(p.x - x0) < w]
    if len(S) < 3:
        return None
    return ((min(p.y for p in S) + max(p.y for p in S)) / 2, (min(p.z for p in S) + max(p.z for p in S)) / 2)


def torso_half_width(objs, z, k):
    """Half-width of the torso at height z from the exact section: the closed loop around the body axis."""
    segs = rb.section_segments(objs, 'z', z)
    xs = []
    for a, b in segs:
        for p in (a, b):
            if abs(p.y) < 0.12 * k:
                xs.append(p.x)
    if not xs:
        return None
    # walk out from x=0 on each side until a gap of 3 cm (the sleeve/arm walls are separate further out)
    def side(sgn):
        vals = sorted(sgn * x for x in xs if sgn * x > 0)
        last = 0.0
        for v in vals:
            if v - last > 0.03 * k:
                break
            last = v
        return last
    return (side(1) + side(-1)) / 2


def find_wrist(Pts, sx, tip, k):
    """Wrist on a T-pose arm (|x| along the arm): the hand widens (palm, fingers spread in y); scan the outer half
    for the narrowest forearm section, then the first x past it where the width exceeds 1.4x that minimum."""
    def width(x0, w=0.01):
        S = [p for p in Pts if abs(abs(p.x) - x0) < w]
        return (max(p.y for p in S) - min(p.y for p in S)) if len(S) >= 3 else None
    xs = [sx + (tip - sx) * t for t in [0.45 + 0.01 * i for i in range(50)] if sx + (tip - sx) * t < tip - 0.06 * k]
    ws = [(x, width(x)) for x in xs]; ws = [(x, w) for x, w in ws if w]
    if not ws:
        return None
    xm, wm = min(ws, key=lambda t: t[1])
    for x, w in ws:
        if x > xm and w > 1.4 * wm:
            return x
    return None


def landmarks(A, parts):
    rc = rb.rc; k = rb.K; H = P(A, 'HEIGHT_M')
    body, head = parts['Body'], parts.get('Head')
    Hb = LMv(A, 'H_body') or H                 # proportions of the BODY (a cone hood / brick crown is not body height)
    hzm = LMv(A, 'head_measure_zmax')          # measure the head without what sits on it (B03 hollow brick crown:
    mh = head                                  # the skill's skull slice near the top found no vertex)
    if head is not None and hzm is not None:
        mh = head.copy(); mh.data = head.data.copy(); bpy.context.scene.collection.objects.link(mh)
        import bmesh
        bm = bmesh.new(); bm.from_mesh(mh.data)
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z > hzm], context='VERTS'); bm.to_mesh(mh.data); bm.free()
    try:
        L = rc.measure_landmarks(body, mh, H=Hb, verbose=True)
    finally:
        if mh is not head:
            me = mh.data; bpy.data.objects.remove(mh); bpy.data.meshes.remove(me)
    notes = list(L['_notes'])
    cloth = [o for r, o in parts.items() if r.startswith('Cloth_')]
    for key in ('pelvis', 'spine1', 'spine2', 'chest'):
        z = L[key][2]; y, rng = rb.torso_center_y([body] + cloth, z, 0.06 * H)
        if y is not None:
            notes.append(f'{key} y {L[key][1]:+.3f} -> {y:+.3f} (section)'); L[key] = (0.0, round(y, 4), z)
    lab, isl = rb._islands(body); V = [v.co.copy() for v in body.data.vertices]
    arm_src = LMv(A, 'arm_islands_src')         # stage-0 island ids of the +X arm (rb_isl attribute)
    if arm_src is not None:
        ai = body.data.attributes['rb_isl']
        A_ = [V[i] for i in range(len(V)) if ai.data[i].value in arm_src]
    else:                                      # points of the +X arm: Body vertices beyond the shoulder at arm height (no sleeve flaps)
        sl_ = body.data.attributes.get('rb_sleeve')
        A_ = [V[i] for i in range(len(V)) if V[i].x > 0.30 * k and V[i].z > LMv(A, 'arm_z_min', 0.75 * H)
              and (sl_ is None or sl_.data[i].value == 0)]
    zarm = sorted(p.z for p in A_)[len(A_) // 2] if A_ else L['shoulder'][2]
    hw = LMv(A, 'torso_half_w') or torso_half_width([body], zarm - 0.10 * k, k)
    sx = hw + 0.02 * H
    tip = max(p.x for p in A_)
    wx = LMv(A, 'wrist_x') or find_wrist(A_, sx, tip, k) or (sx + rc.PRIOR['wrist_frac'] * (tip - sx))
    ex = sx + rc.PRIOR['elbow_frac'] * (wx - sx)
    samples = [a for a in (_axis_at(A_, sx + f * (wx - sx)) for f in (0.3, 0.45, 0.6, 0.75, 0.9)) if a]
    ay = sorted(a[0] for a in samples)[len(samples) // 2] if samples else L['shoulder'][1]
    az = sorted(a[1] for a in samples)[len(samples) // 2] if samples else L['shoulder'][2]
    if LMv(A, 'arm_axis'):                     # trumpet sleeves hide the upper arm: axis from the hand's height
        ay, az = LMv(A, 'arm_axis'); samples = []
    def at(x):
        a = None if LMv(A, 'arm_axis') else _axis_at(A_, x)
        return (round(x, 4), round(a[0] if a else ay, 4), round(a[1] if a else az, 4))
    L['shoulder'] = (round(sx, 4), round(ay + 0.005 * H, 4), round(az, 4)); L['elbow'] = at(ex); L['wrist'] = at(wx)
    L['hand_end'] = (round(tip, 4), L['wrist'][1], round(az - 0.008 * H, 4))
    notes.append(f'arms: torso half-width {hw:.3f} -> shoulder x {sx:.3f}, elbow {ex:.3f}, wrist {wx:.3f}, hand end {tip:.3f}')
    if head is not None and LMv(A, 'head_axis', True):
        hx = rc.mirror_center([v.co.copy() for v in head.data.vertices], lo=-0.08 * k, hi=0.08 * k, step=0.001, cap=0.05 * k)[0]
        if abs(hx) > 0.004 * k:
            for key in ('neck', 'head', 'head_top'):
                L[key] = (round(hx, 4), L[key][1], L[key][2])
            notes.append(f'neck/head x {hx:+.3f} (head piece axis)')
    nz = L['neck'][2]
    L['clav_in'] = (round(rc.PRIOR['clav_in_x'] * H, 4), round((L['chest'][1] + L['neck'][1]) / 2, 4),
                    round(nz - rc.PRIOR['clav_in_below_neck'] * H, 4))
    kz = LMv(A, 'knee_z')
    if kz:
        lg = set((P(A, 'ISL', {}) or {}).get('legs', [])); ai_ = body.data.attributes.get('rb_isl')
        VL = [V[i] for i in range(len(V)) if ai_.data[i].value in lg] if (lg and ai_ is not None) else V   # leg islands only
        for s, Pn in ((1, 'L'), (-1, 'R')):
            S = [p for p in VL if s * p.x > 0.02 * k and abs(p.z - kz) < 0.025 * k]
            if len(S) >= 3:
                L[Pn + '_knee'] = (round((min(p.x for p in S) + max(p.x for p in S)) / 2, 4),
                                   round((min(p.y for p in S) + max(p.y for p in S)) / 2, 4), kz)
        hy = (L['L_knee'][1] + L['R_knee'][1]) / 2
        for Pn in ('L', 'R'):
            x, _, z = L[Pn + '_hip']; L[Pn + '_hip'] = (x, round(hy, 4), z)
            a, b, c = (rb.Vector(L[Pn + kk]) for kk in ('_hip', '_knee', '_ankle'))
            t = (b - a).dot(c - a) / max((c - a).length_squared, 1e-9); d = (b - (a + (c - a) * t)).y
            if d > -0.003 * H:
                x, y, z = L[Pn + '_knee']; L[Pn + '_knee'] = (x, round(y - d - 0.003 * H, 4), z)
        for kk in ('hip', 'knee', 'ankle', 'ball', 'toe'):
            L[kk] = L['L_' + kk]
        notes.append(f'knee z {kz}')
    if LMv(A, 'legs_from_feet'):              # no leg mesh (floor-length skirt): straight legs hip -> foot centre
        for s_, Pn in ((1, 'L'), (-1, 'R')):
            F = [p for p in V if s_ * p.x > 0.02 * k and p.z < 0.06 * Hb]
            if not F:
                continue
            fx = (min(p.x for p in F) + max(p.x for p in F)) / 2
            ank = rb.Vector((fx, L[Pn + '_ankle'][1], rc.PRIOR['ankle_z'] * Hb))
            hip = rb.Vector((s_ * rc.PRIOR['hip_x'] * Hb, L[Pn + '_hip'][1], rc.PRIOR['hip_z'] * Hb))
            kz_ = rc.PRIOR['knee_z'] * Hb; t = (hip.z - kz_) / (hip.z - ank.z)
            kn = hip.lerp(ank, t); kn.y -= 0.006 * Hb                       # pre-bent forward
            L[Pn + '_hip'] = tuple(round(x, 4) for x in hip); L[Pn + '_knee'] = tuple(round(x, 4) for x in kn)
            L[Pn + '_ankle'] = tuple(round(x, 4) for x in ank)
        for kk in ('hip', 'knee', 'ankle', 'ball', 'toe'):
            L[kk] = L['L_' + kk]
        notes.append('legs from the feet (no leg mesh): straight hip -> foot centre, knee pre-bent 0.006H')
    for kk, v in (LMv(A, 'L', {}) or {}).items():      # explicit overrides (e.g. a head hidden in a hood)
        L[kk] = tuple(v); notes.append(f'override {kk} {tuple(round(x, 3) for x in v)}')
        if kk.startswith('L_') and kk[2:] in ('hip', 'knee', 'ankle', 'ball', 'toe'):
            L[kk[2:]] = tuple(v)
    if P(A, 'landmarks_fix'):
        A.landmarks_fix(L, parts, notes)
    L['_notes'] = notes
    return L


def item_chain(points, n, k, top_pad=0.01, bottom_pad=0.01):
    zt = max(p.z for p in points); zb = min(p.z for p in points)
    def cen(z0, z1):
        S = [p for p in points if z0 <= p.z <= z1]
        return sum(S, rb.Vector()) / len(S)
    t = cen(zt - 0.03 * k, zt); b = cen(zb, zb + 0.03 * k); t.z = zt - top_pad * k; b.z = zb + bottom_pad * k
    return [t.lerp(b, i / n) for i in range(n + 1)]


def s3(ctx, A):
    aid = ctx['aid']; rc = rb.rc; k = rb.K
    rb.open_blend(os.path.join(ctx['work'], 's2_parts.blend'))
    parts = parts_by_role()
    L = landmarks(A, parts)
    for kk in L:
        if not kk.startswith('_'):
            print('  ', kk, L[kk])
    for n in L['_notes']:
        print('  note:', n)
    rig = rb.build_skeleton(aid + '_Rig', L, k)
    chains = {}
    # cloth parts: angular sector chains
    for label, spec in (P(A, 'CLOTH', {}) or {}).items():
        ob = parts.get(label)
        if ob is None and label in inbody_labels(A):
            bd = parts['Body']; ac = bd.data.attributes.get('rb_cloth'); code = inbody_code(A, label)
            Pts = [v.co.copy() for v in bd.data.vertices if ac is not None and ac.data[v.index].value == code]
        elif ob is None:
            continue
        else:
            Pts = [v.co.copy() for v in ob.data.vertices]
        cen = spec.get('center', 'pelvis')
        cen = (0.0, L['pelvis'][1]) if cen == 'pelvis' else (cen[0] * k, cen[1] * k)
        if spec.get('z_top') is not None:      # chains on the hanging part only (U03: the collar round the neck put every
            Pts = [p for p in Pts if p.z < spec['z_top']]     # cloak chain's root at the nape, running diagonally)
        for tag, a0 in spec['chains']:
            pts = rb.sector_chain(Pts, a0, cen, half=spec.get('half', 20), n=spec.get('n', 3))
            if pts is None:
                print('  no points for chain', spec['prefix'], tag); continue
            par = spec.get('parent', 'pelvis')
            if isinstance(par, dict):
                par = par.get(tag, 'pelvis')
            chains[f"{spec['prefix']}_{tag}"] = rc.add_chain(rig, f"{spec['prefix']}_{tag}", pts, par)
    # sleeve flaps (Body vertices with rb_sleeve 1 = L, 2 = R)
    sv = P(A, 'SLEEVES')
    body = parts['Body']
    if sv and body.data.attributes.get('rb_sleeve'):
        sl = body.data.attributes['rb_sleeve']; zt_ = sv['z_top']
        for val, Pn in ((1, 'L'), (2, 'R')):
            F = [body.data.vertices[i].co.copy() for i in range(len(body.data.vertices)) if sl.data[i].value == val and body.data.vertices[i].co.z < zt_ + 0.01 * k]
            if len(F) < 6:
                continue
            top = [p for p in F if p.z > zt_ - 0.04 * k] or F; t = sum(top, rb.Vector()) / len(top); t.z = zt_
            zb = min(p.z for p in F); low = [p for p in F if p.z < zb + 0.05 * k]; b = sum(low, rb.Vector()) / len(low); b.z = zb + 0.02 * k
            chains[f'sleeve_{Pn}'] = rc.add_chain(rig, f'sleeve_{Pn}', [t, t.lerp(b, 0.5), b], f'{Pn}_UpperArm')
    # accessory items: rigid bones and strands (parents fixed in s4 by the hook rule unless given)
    acc = parts.get('Accessory'); items = {}
    if acc is not None and acc.data.attributes.get('rb_acc'):
        at = acc.data.attributes['rb_acc']
        for code, (name, spec) in enumerate((P(A, 'ACC', {}) or {}).items(), start=1):
            vs = [acc.data.vertices[i].co.copy() for i in range(len(acc.data.vertices)) if at.data[i].value == code]
            if not vs:
                continue
            mode = spec['mode']
            if mode in ('rigid', 'strand'):
                n = spec.get('n', 1 if mode == 'rigid' else 2)
                pts = item_chain(vs, n, k)
                bname = spec.get('bone', name)
                chains[bname] = rc.add_chain(rig, bname, pts, spec.get('parent') or 'spine_01')
                if mode == 'rigid' and len(chains[bname]) == 1:         # add_chain names it <prefix>_01; keep the plain name
                    pass
                items[name] = dict(code=code, mode=mode, bones=chains[bname], parent=spec.get('parent'))
            else:
                items[name] = dict(code=code, mode=mode)
    if P(A, 'extra_chains'):
        A.extra_chains(rig, parts, chains, L)
    rig['rb_chains'] = json.dumps(chains)
    rig['rb_items'] = json.dumps(items)
    rig['rb_landmarks'] = json.dumps({kk: v for kk, v in L.items() if not kk.startswith('_')})
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
    for o in parts.values():
        rc.bind(o, rig)
    rep = dict(bones=len(rig.data.bones), deform=sum(1 for b in rig.data.bones if b.use_deform),
               chains={n: len(v) for n, v in chains.items()}, notes=L['_notes'], lengths=rb.bone_lengths(rig))
    with open(os.path.join(ctx['work'], 's3_skeleton.json'), 'w') as f:
        json.dump(rep, f, indent=1)
    meshes = ordered_parts()
    proxy = rb.bone_proxy(rig, posed=False)
    rb.render_views(os.path.join(ctx['work'], 's3_xray'), meshes, views=('front', 'left', 'back'), color_type='TEXTURE',
                    res=1100, xray=True, bones=proxy, bone_xray_alpha=0.35)
    hb = rig.data.bones['head']; hc = (hb.head_local + rig.data.bones['neck'].head_local) / 2
    for v in ('front', 'left'):
        rb.render_closeup(os.path.join(ctx['work'], f's3_neck_{v}.png'), meshes, hc, 0.30 * P(A, 'HEIGHT_M'), v, xray=True, alpha=0.35)
        rb.render_closeup(os.path.join(ctx['work'], f's3_neck_{v}_bones.png'), [proxy], hc, 0.30 * P(A, 'HEIGHT_M'), v, color_type='VERTEX')
    bpy.data.objects.remove(proxy)
    rb.save(os.path.join(ctx['work'], 's3_skeleton.blend'))
    rb.append_log(ctx['log'], f"s3 skeleton: {rep['bones']} bones ({rep['deform']} deform), chains {rep['chains']}; notes: " + ' | '.join(L['_notes']))


# ================================================================== s4 weights
def s4(ctx, A):
    aid = ctx['aid']; rc = rb.rc; k = rb.K; H = P(A, 'HEIGHT_M')
    rb.NECK_HALF_W = LMv(A, 'neck_half_w'); rb.LEG_WIN = tuple(LMv(A, 'leg_win', (-0.05, 0.10)))
    rb.HIP_BLEND = tuple(LMv(A, 'hip_blend')) if LMv(A, 'hip_blend') else None
    rb.open_blend(os.path.join(ctx['work'], 's3_skeleton.blend'))
    parts = parts_by_role(); body = parts['Body']; head = parts.get('Head'); acc = parts.get('Accessory')
    rig = bpy.data.objects[aid + '_Rig']; chains = json.loads(rig['rb_chains']); items = json.loads(rig.get('rb_items', '{}'))
    B = rig.data.bones; rep = {}
    if head is not None:
        for v in head.data.vertices:
            rc.set_weights(head, v.index, {'head': 1.0})
        rc.finalize_weights(head)
    skin = set(); head_band = None
    if head is not None and LMv(A, 'neck_mode') == 'band':
        head_band = 'pending'
    elif head is not None:
        try:
            skin = rb.neck_skin_from_cut(body, head)
        except RuntimeError as e:      # head cut out of a big island (hood/face fused with the torso): harmonic band later
            print('neck skin:', e); head_band = 'pending'
    rep['neck_skin_verts'] = len(skin)
    lab, isl = rb._islands(body); V = body.data.vertices
    sl = body.data.attributes.get('rb_sleeve')
    torso = max(range(len(isl)), key=lambda kk: len(isl[kk]))
    shj = B['L_UpperArm'].head_local
    amx = LMv(A, 'arm_mask_x') or (abs(shj.x) - 0.08 * k)
    amz = LMv(A, 'arm_mask_z') or (shj.z - 0.35 * k)
    arm_isl = {kk for kk, c in enumerate(isl) if min(abs(V[i].co.x) for i in c) > abs(shj.x) + 0.05 * k and len(c) > 30
               and max(V[i].co.z for i in c) > shj.z - 0.3 * k}
    def is_arm(i):
        if P(A, 'is_arm'):
            return A.is_arm(i, V, lab, torso, arm_isl, sl, shj)
        return (lab[i] in arm_isl or (sl is not None and sl.data[i].value != 0)
                or (abs(V[i].co.x) > amx and V[i].co.z > amz and lab[i] not in arm_isl and i not in skin
                    and V[i].co.z > B['L_Thigh'].head_local.z + 0.05 * k))
    arm_mask = [i for i in range(len(V)) if is_arm(i)]
    rc.body_weights(body, rig, is_arm, keep=skin)
    rc.store_mask(body, 'rig_arm', arm_mask)
    rep['arm_mask'] = len(arm_mask)
    band = [i for i in arm_mask if lab[i] not in arm_isl and i not in skin]
    cdx, cdz = LMv(A, 'cap', (0.12, 0.04))
    cap_x, cap_z = abs(shj.x) + cdx * k, shj.z - cdz * k
    far = LMv(A, 'arm_anchor_x') or (abs(shj.x) + 0.20 * k)
    soz = LMv(A, 'sleeve_one_zmin')        # sleeve fused to the hip below this: free there, blends arm -> hip (P01)
    ones = [i for i in band if abs(V[i].co.x) > far or (sl is not None and sl.data[i].value != 0 and abs(V[i].co.x) > abs(shj.x) + LMv(A, 'sleeve_one_dx', 0.10) * k
                                                         and (soz is None or V[i].co.z >= soz * k))
            or (abs(V[i].co.x) > cap_x and V[i].co.z > cap_z)]
    zeros = [i for i in band if (abs(V[i].co.x) < amx + 0.02 * k or V[i].co.z < amz + 0.03 * k)
             and not (sl is not None and sl.data[i].value != 0)]      # hanging sleeves go below the mask floor
    if P(A, 'arm_band'):                   # asset rule for what is all arm / all torso around the shoulder (P05: texture)
        ones, zeros = A.arm_band(body, rig, band, ones, zeros, rep)
    if band:
        rb.smooth_arm_blend(body, rig, band, ones, zeros)
    rep['arm_blend'] = dict(band=len(band), ones=len(ones), zeros=len(zeros))
    nflap = 0
    sxm = (P(A, 'SLEEVE_GEO') or {}).get('x_min') if LMv(A, 'sleeve_x_ramp', True) else None
    if sl is not None:
        for val, Pn in ((1, 'L'), (2, 'R')):
            if f'sleeve_{Pn}' not in chains:
                continue
            bones = chains[f'sleeve_{Pn}']; jz = rb.chain_joint_z(rig, bones); za = B[f'{Pn}_UpperArm'].head_local.z
            for i in range(len(V)):
                if sl.data[i].value != val:
                    continue
                z = V[i].co.z; s_ = rc.sm(za - 0.06 * k, za - 0.16 * k, z)
                if sxm is not None:      # ramp in from the sleeve region's inner edge too (P01: hard seam at x_min, 24x)
                    s_ *= rc.sm(sxm, sxm + LMv(A, 'sleeve_x_ramp_w', 0.06) * k, abs(V[i].co.x))
                if s_ <= 0:
                    continue
                rc.set_weights(body, i, rb.blend(rb.vertex_weights(body, i), rc.chain_weights(bones, jz, z, blend=0.04 * k), s_)); nflap += 1
    arm_ids = set((P(A, 'ISL', {}) or {}).get('arms', [])); ai_ = body.data.attributes.get('rb_isl')
    if arm_ids and ai_ is not None:    # only the hand islands carry Hand: a sleeve cuff past the wrist follows the forearm
        for i in range(len(V)):
            if ai_.data[i].value not in arm_ids:
                d = rb.vertex_weights(body, i); Pn = 'L' if V[i].co.x > 0 else 'R'
                h = d.pop(f'{Pn}_Hand', 0.0)
                if h > 0:
                    d[f'{Pn}_ForeArm'] = d.get(f'{Pn}_ForeArm', 0.0) + h; rc.set_weights(body, i, d)
    if sl is not None:                 # sleeve cloth never follows the hand (trumpet cuff past the wrist: 4.7x on arms_down)
        for i in range(len(V)):
            if sl.data[i].value:
                d = rb.vertex_weights(body, i); Pn = 'L' if V[i].co.x > 0 else 'R'
                h = d.pop(f'{Pn}_Hand', 0.0)
                if h > 0:
                    d[f'{Pn}_ForeArm'] = d.get(f'{Pn}_ForeArm', 0.0) + h; rc.set_weights(body, i, d)
    if head_band == 'pending':
        if LMv(A, 'head_band_mode') == 'z':
            rep['head_z_band'] = rb.head_z_band(body, head, rig, LMv(A, 'head_band', 0.10) * k, rr=tuple(LMv(A, 'head_band_rr', (0.20, 0.28))))
        else:
            rep['head_seam_band'] = rb.head_seam_band(body, head, LMv(A, 'head_band', 0.10) * k)
    if P(A, 'body_weights_fix'):
        A.body_weights_fix(body, rig, rep)
    rc.finalize_weights(body)
    rep['sleeve_flap_verts'] = nflap
    lm = json.loads(rig['rb_landmarks'])
    _cloth_weights(A, parts, rig, chains, lm, rep, k)
    if P(A, 'cloth_weights_fix'):           # asset rule on the cloth parts (B03: shoulder flaps fold with the arm)
        A.cloth_weights_fix(parts, rig, chains, rep)
    # accessory items
    if acc is not None and acc.data.attributes.get('rb_acc'):
        at = acc.data.attributes['rb_acc']; AV = acc.data.vertices
        for name, it in items.items():
            vs = [i for i in range(len(AV)) if at.data[i].value == it['code']]
            if not vs:
                continue
            mode = it['mode'] if it['mode'] in ('rigid', 'strand') else items_spec(A, name).get('mode', it['mode'])   # follow modes: config wins (no s3 rerun)
            if mode in ('follow', 'follow_uniform'):
                rc.follow_skin(acc, body, vs); rc.store_mask(acc, 'rig_follow_skin', sorted(set(rc.read_mask(acc, 'rig_follow_skin') or set()) | set(vs)))
                if mode == 'follow_uniform':
                    avg = collections.Counter()
                    for i in vs:
                        for n_, x in rb.vertex_weights(acc, i).items():
                            avg[n_] += x / len(vs)
                    top4 = dict(avg.most_common(4))
                    for i in vs:
                        rc.set_weights(acc, i, top4)
            elif mode == 'torso':           # band round the waist (sash): weights by height like the skin, not from the
                for i in vs:                # nearest skin (inner/outer layers map to different heights -> 6x on a twist)
                    rc.set_weights(acc, i, rc.torso_weights(AV[i].co, rig))
            elif mode == 'follow_cloth':
                src = parts.get(items_spec(A, name).get('part', 'Cloth_Robe')) or body
                rb.follow_part(acc, src, vs)
            elif mode == 'blend_head':
                rc.follow_skin(acc, body, vs)
                zt = max(AV[i].co.z for i in vs); zb = min(AV[i].co.z for i in vs)
                for i in vs:
                    s_ = rc.sm(zt, zb + items_spec(A, name).get('head_frac', 0.35) * (zt - zb), AV[i].co.z)   # top: head, lower: skin
                    rc.set_weights(acc, i, rb.blend({'head': 1.0}, rb.vertex_weights(acc, i), s_))
            elif mode in ('rigid', 'strand'):
                bones = it['bones']
                par = it.get('parent') or rb.hook_parent(rig, body, B[bones[0]].head_local.copy())
                if not it.get('parent'):
                    rb.reparent(rig, bones[0], par)
                rep[f'{name}_parent'] = par
                jz = rb.chain_joint_z(rig, bones); zt = max(AV[i].co.z for i in vs)
                proj = mode == 'strand' and items_spec(A, name).get('along')     # weights along the chain, not by z (U05)
                for i in vs:
                    z = AV[i].co.z
                    if proj:
                        d, s_ = rb.polyline_chain_weights(rig, bones, AV[i].co, 0.03 * k)
                        d = rb.blend({par: 1.0}, d, rc.sm(0.005 * k, 0.04 * k, s_))
                        rc.set_weights(acc, i, d); continue
                    d = {bones[0]: 1.0} if mode == 'rigid' else rc.chain_weights(bones, jz, z, blend=0.03 * k)
                    if mode == 'strand':
                        d = rb.blend({par: 1.0}, d, rc.sm(zt - 0.005 * k, zt - 0.04 * k, z))
                    rc.set_weights(acc, i, d)
            strip = items_spec(A, name).get('strip')      # e.g. a rope over the shoulders must not turn with the head
            if strip:                                      # stripped share -> the torso weights at the vertex (continuous)
                for i in vs:
                    d0 = rb.vertex_weights(acc, i); gone = sum(x for n_, x in d0.items() if n_ in strip)
                    if gone > 0:
                        d = collections.Counter({n_: x for n_, x in d0.items() if n_ not in strip})
                        for n_, x in rc.torso_weights(AV[i].co, rig).items():
                            if n_ not in strip:
                                d[n_] += gone * x
                        rc.set_weights(acc, i, dict(d))
        rc.finalize_weights(acc)
    if head is not None and (P(A, 'HEAD', {}) or {}).get('in_body'):
        rep['head_in_body'] = merge_head_into_body(body, head)
    meshes = ordered_parts()
    rep['health'] = rb.health_all(meshes, rig)
    print(json.dumps(rep, indent=1))
    with open(os.path.join(ctx['work'], 's4_weights.json'), 'w') as f:
        json.dump(rep, f, indent=1)
    for o in meshes:
        rb.set_point_colors(o, rb.weight_colors(o))
    rb.render_views(os.path.join(ctx['work'], 's4_wcol'), meshes, views=('front', 'back', 'left', 'three_quarter'), color_type='VERTEX', res=1000)
    for o in meshes:
        rb.clear_point_colors(o)
    rb.save(os.path.join(ctx['work'], 's4_weights.blend'))
    rb.append_log(ctx['log'], f"s4 weights: neck skin {rep['neck_skin_verts']}, arm mask {rep['arm_mask']}, arm blend {rep['arm_blend']}, "
                  f"sleeve flaps {nflap}; health " + '; '.join(f"{n.split(aid + '_', 1)[-1]} maxinf {v['max_influences']} notnorm {v['not_normalised']} "
                                                              f"empty {v['empty']} nondeform {v['on_non_deform']}" for n, v in rep['health'].items()))


def merge_head_into_body(body, head):
    """HEAD in_body (user: no separate head part, P05): the head is cut and weighted as a part up to here (landmarks,
    head 1 + the geodesic band on the Body side, head 1 on both sides of the cut), then joined back into Body and the
    cut welded, which restores the original topology. Head vertices keep rb_head = 1."""
    import bmesh
    hm = head.data
    a = hm.attributes.get('rb_head') or hm.attributes.new('rb_head', 'INT', 'POINT')
    for i in range(len(hm.vertices)):
        a.data[i].value = 1
    for o in bpy.context.view_layer.objects:
        o.select_set(o in (body, head))
    bpy.context.view_layer.objects.active = body
    with bpy.context.temp_override(active_object=body, object=body, selected_objects=[body, head],
                                   selected_editable_objects=[body, head]):
        bpy.ops.object.join()
    m = body.data; ah = m.attributes['rb_head']
    bv = [v.index for v in m.vertices if ah.data[v.index].value == 0]
    kd = rb.kdtree.KDTree(len(bv))
    for i in bv:
        kd.insert(m.vertices[i].co, i)
    kd.balance(); pairs = {}
    for v in m.vertices:
        if ah.data[v.index].value == 1:
            co, j, d = kd.find(v.co)
            if j is not None and d < 1e-5:
                pairs[v.index] = j
    bm = bmesh.new(); bm.from_mesh(m); bm.verts.ensure_lookup_table()
    bmesh.ops.weld_verts(bm, targetmap={bm.verts[i]: bm.verts[j] for i, j in pairs.items()})
    over2 = sum(1 for e in bm.edges if len(e.link_faces) > 2)
    bm.to_mesh(m); bm.free(); m.update()
    return dict(welded=len(pairs), verts=len(m.vertices), edges_over_2_faces=over2)


def items_spec(A, name):
    return (P(A, 'ACC', {}) or {}).get(name, {})


def _cloth_weights(A, parts, rig, chains, lm, rep, k):
    rc = rb.rc; body = parts['Body']
    for label, spec in (P(A, 'CLOTH', {}) or {}).items():
        ob = parts.get(label)
        if ob is None and label in inbody_labels(A):
            _inbody_cloth_weights(A, label, spec, body, rig, chains, lm, rep, k)
            continue
        if ob is None:
            continue
        ch = {f"{spec['prefix']}_{t}": chains[f"{spec['prefix']}_{t}"] for t, _ in spec['chains'] if f"{spec['prefix']}_{t}" in chains}
        ang = {f"{spec['prefix']}_{t}": a for t, a in spec['chains']}
        cen = spec.get('center', 'pelvis')
        cen = (0.0, lm['pelvis'][1]) if cen == 'pelvis' else (cen[0] * k, cen[1] * k)
        band_ = rb.seam_band(ob, body, spec.get('seam_band', 0.10) * k)
        legs = set((P(A, 'ISL', {}) or {}).get('legs', [])); bi = body.data.attributes.get('rb_isl')
        if legs and bi is not None:          # a leg island touching the cloth (P01 shins inside the dress) is not a cut seam
            band_ = {v: js for v, js in band_.items() if bi.data[js[0]].value not in legs}
        tf = spec.get('top_follow')            # a layer that only overlaps the bodice (no shared vertices): top follows the skin
        if tf:
            zt = max(v.co.z for v in ob.data.vertices)
            kd = rb.kdtree.KDTree(len(body.data.vertices))
            for bv in body.data.vertices:
                kd.insert(bv.co, bv.index)
            kd.balance()
        for v in ob.data.vertices:
            d = rb.angular_chain_weights(v.co, rig, ch, ang, cen, blend_z=0.06 * k)
            if v.index in band_:
                j, s_ = band_[v.index]; d = rb.blend(rb.vertex_weights(body, j), d, s_)
            elif tf:
                s_ = rc.sm(zt, zt - tf * k, v.co.z)
                if s_ < 1:
                    d = rb.blend(rb.vertex_weights(body, kd.find(v.co)[1]), d, s_)
            rc.set_weights(ob, v.index, d)
        rc.finalize_weights(ob)
        rep[label + '_seam_band'] = len(band_)


def _inbody_cloth_weights(A, label, spec, body, rig, chains, lm, rep, k):
    """Cloth kept in the Body mesh: its vertices (rb_cloth == code) take the angular chain weights, blended from the
    torso weights at the region's edge (the old cut line) over seam_band (geodesic), like a cut seam without the cut."""
    rc = rb.rc; ac = body.data.attributes['rb_cloth']; code = inbody_code(A, label); V = body.data.vertices
    region = {i for i in range(len(V)) if ac.data[i].value == code}
    edge = {i for e in body.data.edges for i in e.vertices
            if (e.vertices[0] in region) != (e.vertices[1] in region) and i in region}
    band = spec.get('seam_band', 0.10) * k
    dist = rb.geodesic_voronoi(body, {i: i for i in edge}, lambda i: i in region)[1] if edge else {}
    ch = {f"{spec['prefix']}_{t}": chains[f"{spec['prefix']}_{t}"] for t, _ in spec['chains'] if f"{spec['prefix']}_{t}" in chains}
    ang = {f"{spec['prefix']}_{t}": a for t, a in spec['chains']}
    cen = spec.get('center', 'pelvis')
    cen = (0.0, lm['pelvis'][1]) if cen == 'pelvis' else (cen[0] * k, cen[1] * k)
    nb = 0
    # edge_weights='neighbors' (U05): blend from the weights of the Body the edge touches (feet, legs, belly) instead of
    # the torso weights, which put pelvis 1 next to a toe or a calf where the rags meet the legs
    wout = {}
    if spec.get('edge_weights') == 'neighbors' and edge:
        nbr = collections.defaultdict(list)
        for e in body.data.edges:
            a_, b_ = e.vertices
            if (a_ in region) != (b_ in region):
                (nbr[a_] if a_ in region else nbr[b_]).append(b_ if a_ in region else a_)
        for i in edge:
            acc = collections.Counter()
            for j in nbr.get(i, []):
                for g_, x_ in rb.vertex_weights(body, j).items():
                    acc[g_] += x_
            t_ = sum(acc.values())
            if t_ > 0:
                wout[i] = {g_: x_ / t_ for g_, x_ in acc.items()}
        lbl = rb.geodesic_voronoi(body, {i: i for i in edge}, lambda i: i in region)[0]
    for i in region:
        d = rb.angular_chain_weights(V[i].co, rig, ch, ang, cen, blend_z=0.06 * k)
        s_ = rc.sm(0.0, band, dist.get(i, 1e9))
        if s_ < 1:
            w0 = wout.get(lbl.get(i)) if wout else None
            d = rb.blend(w0 or rc.torso_weights(V[i].co, rig), d, s_); nb += 1
        rc.set_weights(body, i, d)
    rc.finalize_weights(body)
    rep[label + '_in_body'] = dict(verts=len(region), edge=len(edge), band=nb)


# ================================================================== s5 push + QA
QA_RENDER = ('walk', 'arms_down', 'elbows', 'bend', 'twist', 'head_turn', 'kick', 'sit')


def s5(ctx, A):
    aid = ctx['aid']; rc = rb.rc; k = rb.K
    rb.PUSH_KW = P(A, 'PUSH_KW', dict(iters=6, smooth=0.7, rounds=6))
    rb.open_blend(os.path.join(ctx['work'], 's4_weights.blend'))
    meshes = ordered_parts(); parts = parts_by_role(); body = parts['Body']
    rig = bpy.data.objects[aid + '_Rig']; chains = json.loads(rig['rb_chains'])
    radii = rb.leg_radii(rig, body)
    for kk, v in (LMv(A, 'leg_radii', {}) or {}).items():
        radii[kk] = v
    print('leg radii', radii)
    cloth = [o for r, o in parts.items() if r.startswith('Cloth_')] + ([parts['Accessory']] if 'Accessory' in parts else [])
    rb.QA_CLOTH_BODY = bool(inbody_labels(A))
    if inbody_labels(A):
        cloth.append(body)
    has_cloth_chains = any(n.startswith(rc.CLOTH_CHAIN_PREFIXES) for n in chains)
    P_ = None; rep = dict(radii=radii)
    if has_cloth_chains:
        P_ = rb.push_setup(rig, cloth, radii, layer_cap=0.4, skip=tuple(P(A, 'LAYER_SKIP', ('beads', 'flap_rope'))))
        rc.write_push_data(P_); rc.install_live_script()
        rep.update(chains=P_['chains'], layer_pairs=[(P_['chains'][a][0], P_['chains'][b][0]) for a, b in P_['layers']['pairs']],
                   layer_contacts=len(P_['layers']['contacts']), transferred=P_['transferred'])
        rep['rest_push_deg'] = rb.max_rest_push_deg(rig, P_)
    rep['push_kw'] = rb.PUSH_KW; rig['rb_push_kw'] = json.dumps(rb.PUSH_KW)
    rep['health'] = rb.health_all(meshes, rig)
    dch = [chains[n] for n in ('sleeve_L', 'sleeve_R') if n in chains]
    rep['poses'] = rb.qa_poses(meshes, rig, P_, dangle_chains=dch, render=QA_RENDER, out_prefix=os.path.join(ctx['work'], 's5_qa'),
                               views=('front', 'left'), res=800)
    for n, r in rep['poses'].items():
        print(f"{n:10s} stretch {r['stretch']:5.2f} bad {r['bad_edges']:4d}  pen {r.get('pen_nopush', '-')}->{r.get('pen', '-')}  "
              f"seams max {1000 * r['seams']['max']:.1f} mm >2mm {r['seams']['over2mm']}  "
              + ' '.join(f"{kk.split(aid + '_', 1)[-1]}:{v[0]}/{v[1]}/{v[2]}mm" for kk, v in r['per_part'].items() if v[0] > 1.0))
    print('rest push deg', rep.get('rest_push_deg'), 'layers', rep.get('layer_pairs'))
    with open(os.path.join(ctx['work'], 's5_qa.json'), 'w') as f:
        json.dump(rep, f, indent=1, default=str)
    rb.save(os.path.join(ctx['work'], 's5_rig.blend'))


# ================================================================== s6 package
def apply_user_skin(path):
    """Weights the user painted by hand in the Blender window (saved from the editor pull as {mesh: {vertex: {bone: w}}},
    D02 2026-10-27) win over the computed ones on every rebuild. Skipped for a mesh whose vertex count changed."""
    if not os.path.isfile(path):
        return None
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    rep = {}
    for name, W in data.get('meshes', {}).items():
        ob = bpy.data.objects.get(name)
        if ob is None or len(ob.data.vertices) != data.get('counts', {}).get(name, -1):
            rep[name] = 'skipped (mesh changed)'; continue
        for vi, d in W.items():
            rb.rc.set_weights(ob, int(vi), d)
        rep[name] = len(W)
    return rep


def s6(ctx, A):
    aid = ctx['aid']; rc = rb.rc
    rb.open_blend(os.path.join(ctx['work'], 's5_rig.blend'))
    meshes = ordered_parts(); rig = bpy.data.objects[aid + '_Rig']; q = ctx['qa']
    us = apply_user_skin(os.path.join(ctx['rigdir'], f'{aid}_user_skin.json'))
    if us:
        print('USER_SKIN', us)
    os.makedirs(q, exist_ok=True)
    rb.xray_views(os.path.join(q, f'{aid}_xray'), meshes, rig)
    proxy = rb.bone_proxy(rig, posed=False)
    hb = rig.data.bones['head']; hc = (hb.head_local + rig.data.bones['neck'].head_local) / 2; size = 0.30 * P(A, 'HEIGHT_M')
    for v in ('front', 'left'):
        rb.render_closeup(os.path.join(q, f'{aid}_neck_{v}.png'), meshes, hc, size, v, color_type='TEXTURE', xray=True, alpha=0.35)
        rb.render_closeup(os.path.join(q, f'{aid}_neck_{v}_bones.png'), [proxy], hc, size, v, color_type='VERTEX')
    bpy.data.objects.remove(proxy)
    for f in glob.glob(os.path.join(ctx['work'], 's4_wcol_*.png')) + glob.glob(os.path.join(ctx['work'], 's5_qa_*.png')):
        shutil.copy(f, os.path.join(q, f'{aid}_' + os.path.basename(f)))
    s2 = json.load(open(os.path.join(ctx['work'], 's2_parts.json')))
    s3 = json.load(open(os.path.join(ctx['work'], 's3_skeleton.json')))
    s4 = json.load(open(os.path.join(ctx['work'], 's4_weights.json')))
    s5 = json.load(open(os.path.join(ctx['work'], 's5_qa.json')))
    Bn = rig.data.bones
    val = dict(asset=aid, date='2026-10-26', blender=bpy.app.version_string, height_m=P(A, 'HEIGHT_M'), k=rb.K,
               glb_sha256=json.load(open(os.path.join(ctx['work'], 's0_islands.json')))['sha256'],
               bones=len(Bn), deform=sum(1 for b in Bn if b.use_deform), non_deform=sorted(b.name for b in Bn if not b.use_deform),
               chains=json.loads(rig['rb_chains']), items=json.loads(rig.get('rb_items', '{}')), landmarks=json.loads(rig['rb_landmarks']),
               parts=s2['parts'], seam_pairs=s2['seam_pairs'], skeleton_notes=s3['notes'],
               weights=dict(neck_skin=s4['neck_skin_verts'], arm_mask=s4['arm_mask'], sleeve_flaps=s4['sleeve_flap_verts']),
               health=s5['health'], leg_radii=s5['radii'], push_kw=s5.get('push_kw'), rest_push_deg=s5.get('rest_push_deg'),
               layer_pairs=s5.get('layer_pairs'), poses=s5['poses'],
               reference_skill_rig=dict(arms_down='4.3x/24', elbows='4.1x/35', walk='3.6x/18', knees='3.1x/4', head_turn_neck_head='1.8x/5',
                                        pen_after_push=dict(walk=3, kick=4, step_back=5, sit=8, knees=4, side_step=2)),
               tools=dict(skill='~/.claude/skills/blender-character-rigging/scripts/rig_core.py (unmodified)',
                          batch=f'ashlar/3d/act-01/_batches/rig_v1/tools/ (rigbatch.py, stages.py, assets/{aid}.py, run_stage.py)'))
    with open(os.path.join(ctx['rigdir'], 'validation.json'), 'w', encoding='utf-8') as f:
        json.dump(val, f, indent=1, default=str)
    rb.tidy_for_user(rig)
    rb.save(os.path.join(ctx['rigdir'], f'{aid}_rig.blend'))
