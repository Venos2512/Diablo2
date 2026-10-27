"""rigbatch: glue for the rig_v1 batch (ASHLAR Act I monsters). Runs inside headless Blender 5.1.

- Loads the user's skill `blender-character-rigging` (scripts/rig_core.py) UNMODIFIED and rebinds the
  functions that carry absolute lengths tuned for a 1.80 m character, scaled by k = real height / 1.8
  (G1 2026-10-26: rig at the catalogue height). Everything else is the skill's own code.
- Intake: GLB -> one welded mesh at real height, soles on z = 0, facing -Y (glTF +Z forward).
- Headless QA: Workbench renders (texture / part colours / weight colours / stretch heat), bone proxies
  (armatures do not render), multi-view, composited later with PIL (tools/compose.py).
- QA numbers: weight health, stretch per test pose, seam gaps between parts, cloth penetration.

Usage inside a stage script:
    sys.path.insert(0, TOOLS); import rigbatch as rb; rc = rb.load_skill(k)
"""
import bpy, bmesh, os, sys, json, math, colorsys, collections, hashlib
from mathutils import Vector, Matrix, Quaternion, kdtree
from mathutils.bvhtree import BVHTree

SKILL_DIR = os.path.expanduser(r'~/.claude/skills/blender-character-rigging/scripts')
REF_H = 1.8
BLENDER_PREFS_DONE = False
rc = None          # the skill module, patched by load_skill
K = 1.0
NECK_HALF_W = None  # metres; set per asset to fade the neck influence sideways (None = skill behaviour)
LEG_WIN = (-0.05, 0.10)  # thigh->calf blend window around the knee (skill: -0.05 / +0.10, i.e. biased upward)
PUSH_KW = dict(iters=6)  # skirt_push options for QA (the skill's re-bake pass uses iters 6)
QA_CLOTH_BODY = False   # penetration count includes Body (cloth kept inside the Body mesh)
HIP_BLEND = None    # (below, above, crotch_half_w) metres at k=1: trousers with both legs in one piece (F01). The skill
                    # switches thigh 1 -> pelvis 1 at hip+2 cm and L -> R thigh at x 0: the crotch tears 8-10x on a step.
                    # Here pelvis fades in over hip-below .. hip+above and L/R thighs cross-fade over |x| < crotch_half_w.


def log(*a):
    print('[rb]', *a, flush=True)


# ------------------------------------------------------------------ skill loading + scaling layer

def load_skill(k):
    """Import rig_core fresh and rebind its length-carrying helpers for scale k (=H_real/1.8)."""
    global rc, K
    K = float(k)
    if SKILL_DIR in sys.path:
        sys.path.remove(SKILL_DIR)
    sys.path.insert(0, SKILL_DIR)
    sys.modules.pop('rig_core', None)
    import rig_core as _rc
    rc = _rc
    _patch(rc, K)
    return rc


def _patch(rc, k):
    sm = rc.sm

    def arm_windows(rig, side='L'):
        B = rig.data.bones
        s = abs(B[f'{side}_UpperArm'].head_local.x); e = abs(B[f'{side}_ForeArm'].head_local.x)
        w = abs(B[f'{side}_Hand'].head_local.x)
        return dict(shoulder=(s - 0.045 * k, s + 0.085 * k), elbow=(e - 0.04 * k, e + 0.04 * k),
                    wrist=(w - 0.03 * k, w + 0.02 * k))

    def leg_weights(co, rig):
        B = rig.data.bones; P = 'L' if co.x > 0 else 'R'
        kz = B[f'{P}_Calf'].head_local.z; az = B[f'{P}_Foot'].head_local.z; by = B[f'{P}_Toe'].head_local.y
        th = sm(kz + LEG_WIN[0] * k, kz + LEG_WIN[1] * k, co.z); low = 1 - th
        ft = sm(az + 0.055 * k, az - 0.025 * k, co.z); toe = sm(by + 0.03 * k, by - 0.03 * k, co.y)
        return {f'{P}_Thigh': th, f'{P}_Calf': low * (1 - ft), f'{P}_Foot': low * ft * (1 - toe), f'{P}_Toe': low * ft * toe}

    def torso_weights(co, rig, neck_cap=0.6):
        B = rig.data.bones; z = co.z; t = abs(co.x); P = 'L' if co.x > 0 else 'R'
        names = ['neck', 'chest', 'spine_02', 'spine_01', 'pelvis']
        jz = [B['head'].head_local.z] + [B[n].head_local.z for n in names]
        d = rc.chain_weights(names, jz, z, blend=0.05 * k)
        if d.get('neck', 0) > neck_cap:
            d['chest'] = d.get('chest', 0) + d['neck'] - neck_cap; d['neck'] = neck_cap
        if NECK_HALF_W is not None and d.get('neck', 0) > 0:
            # raised shoulders (U01): the skill gives neck to EVERYTHING above the neck base, shoulder tops
            # included; fade it out sideways past the neck so the trapezius stays with chest/clavicle
            nh = B['neck'].head_local          # horizontal distance to the neck axis: shoulder tops AND the cowl behind
            f = rc.sm(NECK_HALF_W, NECK_HALF_W + 0.06 * k, math.hypot(co.x - nh.x, co.y - nh.y))
            if f > 0:
                d['chest'] = d.get('chest', 0) + d['neck'] * f; d['neck'] *= (1 - f)
        sh = B[f'{P}_UpperArm'].head_local; ci = B[f'{P}_Clavicle'].head_local
        cl = 0.6 * sm(abs(ci.x) + 0.06 * k, abs(sh.x) - 0.005 * k, t) * sm(sh.z - 0.085 * k, sh.z + 0.005 * k, z)
        if cl > 0:
            d = {n: x * (1 - cl) for n, x in d.items()}; d[f'{P}_Clavicle'] = cl
        return d

    def body_weights(body, rig, arm_mask, keep=()):
        m = body.data; B = rig.data.bones
        hipz = min(B['L_Thigh'].head_local.z, B['R_Thigh'].head_local.z)
        win = {s: rc.arm_windows(rig, s) for s in 'LR'}
        def armset(P):
            return {f'{P}_Clavicle', f'{P}_UpperArm', f'{P}_UpperArm_twist', f'{P}_ForeArm', f'{P}_ForeArm_twist', f'{P}_Hand'}
        for v in m.vertices:
            i = v.index; co = v.co
            if i in keep:
                continue
            if HIP_BLEND is not None and co.z < hipz + HIP_BLEND[1] * k and not arm_mask(i):   # hanging sleeves stay arm
                p = sm(hipz - HIP_BLEND[0] * k, hipz + HIP_BLEND[1] * k, co.z)     # pelvis share
                s = sm(-HIP_BLEND[2] * k, HIP_BLEND[2] * k, co.x)                 # L-thigh share across the crotch
                d = collections.Counter()
                for sgn, share in ((1.0, s), (-1.0, 1 - s)):
                    if share > 0 and p < 1:
                        for n, x in rc.leg_weights(Vector((sgn, co.y, co.z)), rig).items():
                            d[n] += x * share * (1 - p)
                if p > 0:
                    for n, x in rc.torso_weights(co, rig).items():
                        d[n] += x * p
                d = dict(d)
            elif co.z < hipz + 0.02 * k:
                d = rc.leg_weights(co, rig)
            elif arm_mask(i):
                P = 'L' if co.x > 0 else 'R'; t = abs(co.x); s0 = win[P]['shoulder'][0]
                f = 1 - sm(s0 - 0.01 * k, s0 + 0.07 * k, t)
                d = {n: x * f for n, x in rc.torso_weights(co, rig).items() if n not in armset(P)}; rest = 1 - sum(d.values())
                for n, x in rc.arm_weights(t, P, **win[P]).items():
                    d[n] = d.get(n, 0) + x * rest
            else:
                d = rc.torso_weights(co, rig)
            rc.set_weights(body, i, d)
        rc.finalize_weights(body)

    def chain_from_points(P, a0=None, center=(0.0, -0.05 * k), slab=0.12 * k, n=3):
        def ang(p): return math.degrees(math.atan2(p.x - center[0], -(p.y - center[1])))
        def adiff(a, b): return abs(((a - b + 180) % 360) - 180)
        zt = max(p.z for p in P); zb = min(p.z for p in P)
        def cen(cond):
            S = [p for p in P if cond(p)]
            if a0 is not None:
                S = sorted(S, key=lambda p: adiff(ang(p), a0))[:6]
            return sum(S, Vector()) / len(S)
        t = cen(lambda p: p.z > zt - slab); b = cen(lambda p: p.z < zb + slab)
        t.z = zt - 0.02 * k; b.z = zb + 0.02 * k
        return [t.lerp(b, i / n) for i in range(n + 1)]

    def symmetry_report(ob):
        V = [v.co.copy() for v in ob.data.vertices]
        zmax = max(p.z for p in V)
        regions = {'head': lambda p: p.z > zmax * 0.89, 'feet': lambda p: p.z < zmax * 0.07,
                   'torso': lambda p: zmax * 0.67 < p.z < zmax * 0.89 and abs(p.x) < 0.25 * k,
                   'arms': lambda p: abs(p.x) > 0.5 * k and p.z > zmax * 0.7}
        out = {}
        for n, f in regions.items():
            sel = [p for p in V if f(p)]
            if sel:
                out[n] = rc.mirror_center(sel, lo=-0.1 * k, hi=0.1 * k, step=0.002 * k, cap=0.05 * k)
        for n, (c, e) in out.items():
            print(f'{n:6s} axis x={c:+.4f}  err={e:.4f}')
        return out

    _orig_part_key = rc._part_key
    def part_key(chain_name):
        # skill knows panels _F/_B/_L/_R/_side/_back/_A of one garment; add the diagonal panels so a 6-chain
        # tunic (FL, FR, L, R, BL, BR) stays ONE garment for cloth_layers / layer_weight_transfer
        for suf in ('_FL', '_FR', '_BL', '_BR'):
            if chain_name.endswith(suf) and chain_name.count('_') >= 2:
                return chain_name[: -len(suf)]
        return _orig_part_key(chain_name)
    rc._part_key = part_key
    rc.arm_windows = arm_windows
    rc.leg_weights = leg_weights
    rc.torso_weights = torso_weights
    rc.body_weights = body_weights
    rc.chain_from_points = chain_from_points
    rc.symmetry_report = symmetry_report
    rc._rb_k = k


def build_skeleton(name, L, k=None):
    """rc.build_body_skeleton with socket/helper sizes scaled by k, and optional per-side arms:
    keys R_clav_in/R_shoulder/R_elbow/R_wrist/R_hand_end (absolute) are used instead of mirroring
    (asymmetric arms, e.g. W06). Same bone names, parents, rolls and connect flags as the skill."""
    k = K if k is None else k
    arm = bpy.data.armatures.new(name); rig = bpy.data.objects.new(name, arm)
    bpy.context.scene.collection.objects.link(rig)
    bpy.ops.object.select_all(action='DESELECT'); bpy.context.view_layer.objects.active = rig; rig.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT'); eb = arm.edit_bones
    def mir(t, s): return Vector((t[0] * s, t[1], t[2]))
    def B(n, h, t, par=None, conn=False, deform=True, roll=None):
        b = eb.new(n); b.head = Vector(h); b.tail = Vector(t); b.use_deform = deform
        if par:
            b.parent = eb[par]; b.use_connect = conn
        if roll:
            b.align_roll(Vector(roll))
    pz = L['pelvis']
    B('root', (0, 0, 0), (0, 0.25 * k, 0), deform=False)
    B('ground', (0, 0, 0), (0, 0.12 * k, 0), 'root', deform=False)
    B('hit_origin', (0, pz[1], pz[2]), (0, pz[1], pz[2] + 0.1 * k), 'root', deform=False)
    B('cog', pz, (0, pz[1] + 0.15 * k, pz[2]), 'root', deform=False)
    fw = (0, -1, 0)
    B('pelvis', pz, L['spine1'], 'cog', roll=fw)
    B('spine_01', L['spine1'], L['spine2'], 'pelvis', True, roll=fw)
    B('spine_02', L['spine2'], L['chest'], 'spine_01', True, roll=fw)
    B('chest', L['chest'], L['neck'], 'spine_02', True, roll=fw)
    B('fx_chest', (0, L['chest'][1] - 0.11 * k, L['chest'][2] + 0.06 * k), (0, L['chest'][1] - 0.11 * k, L['chest'][2] + 0.14 * k), 'chest', deform=False)
    B('neck', L['neck'], L['head'], 'chest', True, roll=fw)
    B('head', L['head'], L['head_top'], 'neck', True, roll=fw)
    ht = L['head_top']; B('fx_head', ht, (ht[0], ht[1], ht[2] + 0.08 * k), 'head', deform=False)
    for s, P in ((1, 'L'), (-1, 'R')):
        def g(key):
            if s < 0 and f'R_{key}' in L:
                return Vector(L[f'R_{key}'])
            return mir(L[key], s)
        ci, sh, el, wr, he = (g(x) for x in ('clav_in', 'shoulder', 'elbow', 'wrist', 'hand_end'))
        B(f'{P}_Clavicle', ci, sh, 'chest', roll=(0, 0, 1))
        B(f'{P}_UpperArm', sh, el, f'{P}_Clavicle', True, roll=(0, 0, 1))
        B(f'{P}_UpperArm_twist', sh, sh.lerp(el, 0.5), f'{P}_UpperArm', roll=(0, 0, 1))
        B(f'{P}_ForeArm', el, wr, f'{P}_UpperArm', True, roll=(0, 0, 1))
        B(f'{P}_ForeArm_twist', el.lerp(wr, 0.5), wr, f'{P}_ForeArm', roll=(0, 0, 1))
        B(f'{P}_Hand', wr, wr.lerp(he, 0.55), f'{P}_ForeArm', True, roll=(0, 0, 1))
        hm = wr.lerp(he, 0.55)
        B(f'fx_hand_{P}', hm, wr.lerp(he, 0.8), f'{P}_Hand', deform=False)
        B(f'{P}_weapon_attach', hm, hm - Vector((0, 0, 0.08 * k)), f'{P}_Hand', deform=False)
        hp, kn, an, ba, to = (Vector(L[f'R_{x}']) if s < 0 and f'R_{x}' in L else mir(L[x], s)
                              for x in ('hip', 'knee', 'ankle', 'ball', 'toe'))
        B(f'{P}_Thigh', hp, kn, 'pelvis', roll=fw)
        B(f'{P}_Calf', kn, an, f'{P}_Thigh', True, roll=fw)
        B(f'{P}_Foot', an, ba, f'{P}_Calf', True, roll=(0, 0, 1))
        B(f'{P}_Toe', ba, to, f'{P}_Foot', True, roll=(0, 0, 1))
    bpy.ops.object.mode_set(mode='OBJECT')
    arm.display_type = 'STICK'; rig.show_in_front = True
    rig['skill_scale'] = k
    return rig


# ------------------------------------------------------------------ files

def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def prefs():
    bpy.context.preferences.filepaths.save_version = 0


def save(path):
    prefs()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if bpy.context.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.wm.save_as_mainfile(filepath=path, compress=True)
    log('saved', path)


def open_blend(path):
    bpy.ops.wm.open_mainfile(filepath=path)
    prefs()


def append_log(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'a', encoding='utf-8') as f:
        f.write(text.rstrip('\n') + '\n')


# ------------------------------------------------------------------ intake

def intake(glb, name, height_m):
    """Fresh scene with the GLB as ONE mesh '<name>_Src': transforms applied, welded by the importer
    (merge_vertices: co-located verts with equal normals), uniformly scaled so the mesh is height_m
    tall, soles on z=0, bbox centred in x and y. Returns (ob, info)."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    prefs()
    bpy.ops.import_scene.gltf(filepath=glb, merge_vertices=True)
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    for o in meshes:
        M = o.matrix_world.copy(); o.parent = None; o.data.transform(M); o.matrix_world.identity()
    for o in [o for o in bpy.data.objects if o.type != 'MESH']:
        bpy.data.objects.remove(o)
    if len(meshes) > 1:
        bpy.ops.object.select_all(action='DESELECT')
        for o in meshes:
            o.select_set(True)
        bpy.context.view_layer.objects.active = meshes[0]
        bpy.ops.object.join()
    ob = meshes[0]; ob.name = name + '_Src'; ob.data.name = name + '_Src_mesh'
    me = ob.data
    zs = [v.co.z for v in me.vertices]; H0 = max(zs) - min(zs)
    s = height_m / H0
    me.transform(Matrix.Scale(s, 4))
    xs = [v.co.x for v in me.vertices]; ys = [v.co.y for v in me.vertices]; z0 = min(v.co.z for v in me.vertices)
    off = Vector(((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, z0))
    me.transform(Matrix.Translation(-off))
    me.update()
    info = dict(glb=glb.replace('\\', '/'), sha256=sha256(glb), glb_height=H0, scale=s, height_m=height_m,
                verts=len(me.vertices), faces=len(me.polygons), offset=list(off))
    ob['rb_intake'] = json.dumps(info)
    return ob, info


def facing_check(ob):
    """Toes point to -Y: in the lowest 3 % of the mesh the y-range should extend further to -Y than
    the shin centre. Returns (ok, toe_front, heel_back)."""
    V = [v.co for v in ob.data.vertices]; H = max(p.z for p in V)
    foot = [p for p in V if p.z < 0.03 * H]; shin = [p for p in V if 0.08 * H < p.z < 0.15 * H]
    if not foot or not shin:
        return None, 0, 0
    sy = sum(p.y for p in shin) / len(shin)
    front = sy - min(p.y for p in foot); back = max(p.y for p in foot) - sy
    return front > back, round(front, 4), round(back, 4)


# ------------------------------------------------------------------ mesh helpers

def islands(ob):
    """Edge-connected vertex islands -> (labels per vertex, list of index lists)."""
    return rc.islands(ob) if rc else _islands(ob)


def _islands(ob):
    m = ob.data; bm = bmesh.new(); bm.from_mesh(m); bm.verts.ensure_lookup_table()
    lab = [-1] * len(m.vertices); out = []
    for v in bm.verts:
        if lab[v.index] >= 0:
            continue
        kk = len(out); lab[v.index] = kk; st = [v]; comp = []
        while st:
            a = st.pop(); comp.append(a.index)
            for e in a.link_edges:
                b = e.other_vert(a)
                if lab[b.index] < 0:
                    lab[b.index] = kk; st.append(b)
        out.append(comp)
    bm.free()
    return lab, out


def island_rows(ob):
    m = ob.data; lab, isl = _islands(ob); rows = []
    for kk, c in enumerate(isl):
        P = [m.vertices[i].co for i in c]
        cx = sum(p.x for p in P) / len(P); cy = sum(p.y for p in P) / len(P); cz = sum(p.z for p in P) / len(P)
        rows.append(dict(id=kk, n=len(c), c=[round(cx, 4), round(cy, 4), round(cz, 4)],
                         x=[round(min(p.x for p in P), 4), round(max(p.x for p in P), 4)],
                         y=[round(min(p.y for p in P), 4), round(max(p.y for p in P), 4)],
                         z=[round(min(p.z for p in P), 4), round(max(p.z for p in P), 4)]))
    return lab, isl, rows


def split_faces(ob, face_ids, new_name):
    """Move the given faces of ob into a new object (vertices on the cut are duplicated, so both
    sides keep a copy with the same position and weights). Returns the new object."""
    m = ob.data; fs = set(face_ids)
    if bpy.context.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.select_all(action='DESELECT'); bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    for p in m.polygons:
        p.select = p.index in fs
    for e in m.edges:
        e.select = False
    for v in m.vertices:
        v.select = False
    before = set(bpy.data.objects)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_mode(type='FACE')
    bpy.ops.mesh.separate(type='SELECTED'); bpy.ops.object.mode_set(mode='OBJECT')
    new = [o for o in bpy.data.objects if o not in before][0]
    new.name = new_name; new.data.name = new_name + '_mesh'
    bpy.ops.object.select_all(action='DESELECT')
    return new


def split_by_face_label(ob, labels, names, base):
    """labels: one label per face of ob; names: {label: object name}. Faces of every label except
    `base` are separated into their own object (vertices on a cut are duplicated: same position on
    both sides). ob is renamed names[base]. Returns {label: object}."""
    m = ob.data; keys = sorted(set(labels)); code = {lb: i for i, lb in enumerate(keys)}
    a = m.attributes.get('rb_part') or m.attributes.new('rb_part', 'INT', 'FACE')
    for i, lb in enumerate(labels):
        a.data[i].value = code[lb]
    out = {}
    for lb in keys:
        if lb == base:
            continue
        cur = ob.data.attributes['rb_part']
        fids = [p.index for p in ob.data.polygons if cur.data[p.index].value == code[lb]]
        if fids:
            out[lb] = split_faces(ob, fids, names[lb])
    ob.name = names[base]; ob.data.name = names[base] + '_mesh'; out[base] = ob
    for o in out.values():
        at = o.data.attributes.get('rb_part')
        if at:
            o.data.attributes.remove(at)
    return out


def flood_faces(ob, seed_verts, allow_face):
    """Faces reachable from seed vertices through shared edges, only through faces allow_face(poly)."""
    m = ob.data; bm = bmesh.new(); bm.from_mesh(m); bm.verts.ensure_lookup_table(); bm.faces.ensure_lookup_table()
    ok = [allow_face(m.polygons[f.index]) for f in bm.faces]
    seen = set(); st = []
    for vi in seed_verts:
        for f in bm.verts[vi].link_faces:
            if ok[f.index] and f.index not in seen:
                seen.add(f.index); st.append(f)
    while st:
        f = st.pop()
        for e in f.edges:
            for g in e.link_faces:
                if ok[g.index] and g.index not in seen:
                    seen.add(g.index); st.append(g)
    bm.free()
    return seen


def geodesic_voronoi(ob, sources, allowed):
    """Label every allowed vertex with the label of its nearest source (Dijkstra over edge lengths).
    sources: {vertex: label}; allowed(i) -> bool. Returns ({vertex: label}, {vertex: distance})."""
    import heapq
    m = ob.data; bm = bmesh.new(); bm.from_mesh(m); bm.verts.ensure_lookup_table()
    dist = {}; lbl = {}; pq = []
    for i, s in sources.items():
        dist[i] = 0.0; lbl[i] = s; heapq.heappush(pq, (0.0, i))
    while pq:
        d, a = heapq.heappop(pq)
        if d > dist[a]:
            continue
        for e in bm.verts[a].link_edges:
            b = e.other_vert(bm.verts[a]).index
            if not allowed(b):
                continue
            nd = d + e.calc_length()
            if nd < dist.get(b, 1e9):
                dist[b] = nd; lbl[b] = lbl[a]; heapq.heappush(pq, (nd, b))
    bm.free()
    return lbl, dist


def boundary_loops(ob):
    """Open-boundary vertex loops: list of vertex index lists (connected components of boundary edges)."""
    m = ob.data; bm = bmesh.new(); bm.from_mesh(m); bm.edges.ensure_lookup_table()
    adj = collections.defaultdict(list)
    for e in bm.edges:
        if e.is_boundary:
            a, b = e.verts[0].index, e.verts[1].index
            adj[a].append(b); adj[b].append(a)
    bm.free()
    seen = set(); loops = []
    for s in adj:
        if s in seen:
            continue
        comp = []; st = [s]; seen.add(s)
        while st:
            x = st.pop(); comp.append(x)
            for y in adj[x]:
                if y not in seen:
                    seen.add(y); st.append(y)
        loops.append(comp)
    return loops


def faces_of_verts(ob, verts, all_in=True):
    vs = set(verts)
    if all_in:
        return [p.index for p in ob.data.polygons if all(i in vs for i in p.vertices)]
    return [p.index for p in ob.data.polygons if any(i in vs for i in p.vertices)]


def bvh_of(obs):
    """BVH over the world-space triangles of one or more mesh objects (rest shape)."""
    verts = []; polys = []
    for o in obs:
        base = len(verts); M = o.matrix_world
        verts += [M @ v.co for v in o.data.vertices]
        polys += [[base + i for i in p.vertices] for p in o.data.polygons]
    return BVHTree.FromPolygons(verts, polys)


def seam_pairs(objs, tol=1e-5):
    """Coincident vertex pairs between DIFFERENT objects at rest: [(oa, ia, ob, ib)]."""
    pts = []
    for o in objs:
        M = o.matrix_world
        for v in o.data.vertices:
            pts.append((o.name, v.index, M @ v.co))
    kd = kdtree.KDTree(len(pts))
    for j, (_, _, p) in enumerate(pts):
        kd.insert(p, j)
    kd.balance(); out = []
    for j, (on, i, p) in enumerate(pts):
        for _, jj, _ in kd.find_range(p, tol):
            if jj > j and pts[jj][0] != on:
                out.append((on, i, pts[jj][0], pts[jj][1]))
    return out


def ramp_shift_x(ob, verts, c, a, b):
    """Skill stage-1 arm fix: x += c * sm(a, b, |x - c|) for the given vertices (rigid outside b,
    untouched inside a, smooth in between). Moves arms that are symmetric about 0 onto a body axis c."""
    m = ob.data
    for i in verts:
        co = m.vertices[i].co
        co.x += c * rc.sm(a, b, abs(co.x - c))
    m.update()


def limb_profile(points, along, across, lo, hi, step):
    """Cross-section size of a limb along a coordinate: bins [t, t+step) on `along` ('x'|'y'|'z'),
    returns [(t_mid, n, extent of across[0], extent of across[1], centre0, centre1)]."""
    ix = 'xyz'.index(along); ia, ib = ('xyz'.index(across[0]), 'xyz'.index(across[1]))
    out = []; t = lo
    while t < hi - 1e-9:
        S = [p for p in points if t <= p[ix] < t + step]
        if len(S) >= 3:
            A = [p[ia] for p in S]; Bv = [p[ib] for p in S]
            out.append((round(t + step / 2, 4), len(S), round(max(A) - min(A), 4), round(max(Bv) - min(Bv), 4),
                        round((max(A) + min(A)) / 2, 4), round((max(Bv) + min(Bv)) / 2, 4)))
        t += step
    return out


def section_segments(objs, axis, value):
    """Exact mesh ∩ plane (axis in 'xyz', world space): list of (p, q) Vector segments."""
    ai = 'xyz'.index(axis); out = []
    for o in objs:
        M = o.matrix_world; W = [M @ v.co for v in o.data.vertices]
        for f in o.data.polygons:
            pts = [W[i] for i in f.vertices]; ds = [p[ai] - value for p in pts]; cut = []
            for i in range(len(pts)):
                a, b = pts[i], pts[(i + 1) % len(pts)]; da, db = ds[i], ds[(i + 1) % len(pts)]
                if (da < 0) != (db < 0):
                    cut.append(a.lerp(b, da / (da - db)))
            if len(cut) >= 2:
                out.append((cut[0], cut[1]))
    return out


def torso_center_y(objs, z, half_w, back=0.05):
    """Spine y at height z from the EXACT horizontal section (vertex slabs miss low-poly meshes):
    y-range of the section within |x| < half_w; returns mid + back*depth (skill: spine_back = 5 %)."""
    ys = [p.y for s in section_segments(objs, 'z', z) for p in s if abs(p.x) < half_w]
    if len(ys) < 2:
        return None, None
    return (min(ys) + max(ys)) / 2 + back * (max(ys) - min(ys)), (round(min(ys), 4), round(max(ys), 4))


def sector_chain(points, a0, center, half=22.5, n=3, top_band=0.05, bottom_band=0.06, inset=0.02):
    """Chain points for one angular sector of a hanging cloth part with an uneven hem: top = centroid of
    the sector's points in its top band, bottom = centroid of its lowest band (per sector, not global)."""
    def ang(p): return math.degrees(math.atan2(p.x - center[0], -(p.y - center[1])))
    S = [p for p in points if abs(((ang(p) - a0 + 180) % 360) - 180) < half]
    if len(S) < 6:
        return None
    zt = max(p.z for p in S); zb = min(p.z for p in S)
    T = [p for p in S if p.z > zt - top_band]; B = [p for p in S if p.z < zb + bottom_band]
    t = sum(T, Vector()) / len(T); b = sum(B, Vector()) / len(B)
    t.z = zt - inset; b.z = zb + inset
    return [t.lerp(b, i / n) for i in range(n + 1)]


def evaluated_world(o):
    dg = bpy.context.evaluated_depsgraph_get(); ev = o.evaluated_get(dg).to_mesh()
    M = o.matrix_world; P = [M @ v.co for v in ev.vertices]
    o.evaluated_get(dg).to_mesh_clear()
    return P


def seam_gaps(pairs):
    """Max/mean opening of coincident cross-part pairs in the CURRENT pose (metres)."""
    cache = {}
    def P(name):
        if name not in cache:
            cache[name] = evaluated_world(bpy.data.objects[name])
        return cache[name]
    d = [(P(a)[ia] - P(b)[ib]).length for a, ia, b, ib in pairs]
    if not d:
        return dict(n=0, max=0.0, mean=0.0, over2mm=0)
    return dict(n=len(d), max=round(max(d), 5), mean=round(sum(d) / len(d), 6), over2mm=sum(1 for x in d if x > 0.002))


# ------------------------------------------------------------------ colours

PART_COLORS = {'Body': (0.85, 0.62, 0.52), 'Head': (0.35, 0.55, 0.95), 'Accessory': (0.95, 0.80, 0.15),
               'Cloth': (0.55, 0.85, 0.45)}
CLOTH_PALETTE = [(0.20, 0.80, 0.80), (0.85, 0.35, 0.80), (0.95, 0.50, 0.15), (0.45, 0.35, 0.90),
                 (0.30, 0.75, 0.35), (0.90, 0.30, 0.35), (0.65, 0.85, 0.20), (0.25, 0.50, 0.75)]


def golden_color(i, s=0.6, v=0.95):
    return colorsys.hsv_to_rgb((i * 0.61803398875) % 1.0, s, v)


def set_point_colors(ob, cols, name='rb_col'):
    """cols: list of RGB per vertex. Creates/overwrites a FLOAT_COLOR point attribute, makes it active."""
    me = ob.data
    a = me.color_attributes.get(name) or me.color_attributes.new(name, 'FLOAT_COLOR', 'POINT')
    for i, c in enumerate(cols):
        a.data[i].color = (c[0], c[1], c[2], 1.0)
    me.color_attributes.active_color = a
    try:
        me.color_attributes.render_color_index = list(me.color_attributes).index(a)
    except Exception:
        pass
    return a


def clear_point_colors(ob, name='rb_col'):
    a = ob.data.color_attributes.get(name)
    if a:
        ob.data.color_attributes.remove(a)


BONE_HUES = {'pelvis': (1.0, 0.85, 0.2), 'spine_01': (1.0, 0.7, 0.2), 'spine_02': (1.0, 0.55, 0.2),
             'chest': (1.0, 0.4, 0.2), 'neck': (0.9, 0.2, 0.6), 'head': (0.6, 0.3, 1.0)}


def bone_color(name):
    if name in BONE_HUES:
        return BONE_HUES[name]
    side = name[:2]
    seg = {'Clavicle': 0, 'UpperArm': 1, 'UpperArm_twist': 2, 'ForeArm': 3, 'ForeArm_twist': 4, 'Hand': 5,
           'Thigh': 6, 'Calf': 7, 'Foot': 8, 'Toe': 9}
    base = name[2:]
    if side in ('L_', 'R_') and base in seg:
        h = (0.0 if side == 'L_' else 0.55) + 0.045 * seg[base]
        return colorsys.hsv_to_rgb(h % 1.0, 0.75, 0.95)
    hsh = int(hashlib.md5(name.encode()).hexdigest()[:6], 16)
    return colorsys.hsv_to_rgb((hsh % 1000) / 1000.0, 0.55, 0.95)


def weight_colors(ob, bones=None):
    """Per-vertex colour = sum(bone colour x weight) over the vertex groups."""
    gn = [g.name for g in ob.vertex_groups]; out = []
    for v in ob.data.vertices:
        c = Vector((0, 0, 0)); t = 0
        for g in v.groups:
            n = gn[g.group]
            if bones and n not in bones:
                continue
            c += Vector(bone_color(n)) * g.weight; t += g.weight
        out.append(tuple(c / t) if t > 0 else (0.15, 0.15, 0.15))
    return out


def stretch_colors(ob, lo=0.8, hi=1.6):
    """Per-vertex colour from the worst edge ratio touching it (current pose vs rest): grey ok -> red."""
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get(); ev = ob.evaluated_get(dg).to_mesh(); m = ob.data
    worst = [1.0] * len(m.vertices)
    for e in m.edges:
        a, b = e.vertices
        r = (m.vertices[a].co - m.vertices[b].co).length
        if r < 1e-6:
            continue
        q = (ev.vertices[a].co - ev.vertices[b].co).length / r
        q = max(q, 1 / max(q, 1e-6))
        worst[a] = max(worst[a], q); worst[b] = max(worst[b], q)
    ob.evaluated_get(dg).to_mesh_clear()
    cols = []
    for q in worst:
        t = min(max((q - 1.0) / (hi - 1.0), 0.0), 1.0)
        cols.append((0.75 + 0.25 * t, 0.75 * (1 - t), 0.75 * (1 - t)))
    return cols


# ------------------------------------------------------------------ bone proxies (armatures do not render)

def bone_proxy(rig, name='_bone_proxy', deform_only=False, scale=1.0, posed=True):
    """One mesh with an octahedral shape per bone (current pose if posed), coloured per bone.
    Non-deform bones are thin and grey. Rebuild after every pose change."""
    old = bpy.data.objects.get(name)
    if old:
        me = old.data; bpy.data.objects.remove(old)
        if me and me.users == 0:
            bpy.data.meshes.remove(me)
    bpy.context.view_layer.update()
    bm = bmesh.new(); cols = []
    M = rig.matrix_world
    for b in rig.data.bones:
        if deform_only and not b.use_deform:
            continue
        if posed:
            pb = rig.pose.bones[b.name]; h = M @ pb.head; t = M @ pb.tail; Mb = M @ pb.matrix
        else:
            h = M @ b.head_local; t = M @ b.tail_local; Mb = M @ b.matrix_local
        L = (t - h).length
        if L < 1e-6:
            continue
        x = Mb.to_3x3() @ Vector((1, 0, 0)); z = Mb.to_3x3() @ Vector((0, 0, 1))
        w = (0.09 if b.use_deform else 0.035) * L * scale
        y = (t - h) / L
        p0 = h; p1 = h + y * (0.15 * L); tip = t
        ring = [p1 + x.normalized() * w, p1 + z.normalized() * w, p1 - x.normalized() * w, p1 - z.normalized() * w]
        vs = [bm.verts.new(p0)] + [bm.verts.new(r) for r in ring] + [bm.verts.new(tip)]
        for i in range(4):
            bm.faces.new((vs[0], vs[1 + (i + 1) % 4], vs[1 + i]))
            bm.faces.new((vs[5], vs[1 + i], vs[1 + (i + 1) % 4]))
        c = bone_color(b.name) if b.use_deform else (0.55, 0.55, 0.55)
        cols += [c] * 6
        # joint ball (small icosphere approximated by an octahedron)
        r = max(w * 0.9, 1e-4)
        ball = [bm.verts.new(h + d * r) for d in (Vector((1, 0, 0)), Vector((-1, 0, 0)), Vector((0, 1, 0)),
                                                  Vector((0, -1, 0)), Vector((0, 0, 1)), Vector((0, 0, -1)))]
        for a_, b_, c_ in ((0, 2, 4), (2, 1, 4), (1, 3, 4), (3, 0, 4), (2, 0, 5), (1, 2, 5), (3, 1, 5), (0, 3, 5)):
            bm.faces.new((ball[a_], ball[b_], ball[c_]))
        cols += [(0.1, 0.1, 0.1)] * 6
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob)
    set_point_colors(ob, cols)
    return ob


# ------------------------------------------------------------------ rendering

def setup_render(res=900):
    scn = bpy.context.scene
    scn.render.engine = 'BLENDER_WORKBENCH'
    scn.render.resolution_x = scn.render.resolution_y = res
    scn.render.resolution_percentage = 100
    scn.render.film_transparent = True
    scn.display.shading.light = 'STUDIO'
    scn.display.shading.show_object_outline = False
    scn.display.shading.show_cavity = False
    scn.view_settings.view_transform = 'Standard'
    scn.render.image_settings.file_format = 'PNG'
    scn.render.image_settings.color_mode = 'RGBA'
    cam = bpy.data.objects.get('_rb_cam')
    if not cam:
        cd = bpy.data.cameras.new('_rb_cam'); cam = bpy.data.objects.new('_rb_cam', cd)
        scn.collection.objects.link(cam)
    scn.camera = cam
    return cam


def frame_box(objs):
    pts = []
    for o in objs:
        if o.type == 'MESH':
            pts += [o.matrix_world @ v.co for v in o.data.vertices]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return lo, hi


VIEW_DIRS = {'front': (0, -1, 0), 'back': (0, 1, 0), 'left': (1, 0, 0), 'right': (-1, 0, 0),
             'three_quarter': (0.7, -0.7, 0.25), 'top': (0, -0.35, 1), 'topdown': (0, 0, 1)}


def place_camera(cam, lo, hi, view, margin=1.08, ortho=True, center=None, size=None):
    """Orthographic camera looking at the box from direction VIEW_DIRS[view] (camera sits on that side)."""
    d = Vector(VIEW_DIRS[view]).normalized()
    c = center if center is not None else (lo + hi) / 2
    ext = hi - lo
    cam.data.type = 'ORTHO' if ortho else 'PERSP'
    s = size if size is not None else max(ext.x, ext.y, ext.z) * margin
    cam.data.ortho_scale = s; cam.data.clip_start = 0.001; cam.data.clip_end = 1000
    dist = max(ext.length, 1.0) * 6
    cam.location = c + d * dist
    q = (-d).to_track_quat('-Z', 'Y'); cam.rotation_euler = q.to_euler()


def render_to(path):
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    cam = bpy.context.scene.camera
    if cam and cam.data.type == 'ORTHO':      # sidecar for grids / pixel->world (tools/compose.py grid)
        R = cam.matrix_world.to_3x3()
        with open(path[:-4] + '_cam.json', 'w') as f:
            json.dump(dict(loc=list(cam.location), right=list(R @ Vector((1, 0, 0))), up=list(R @ Vector((0, 1, 0))),
                           ortho=cam.data.ortho_scale, res=[bpy.context.scene.render.resolution_x,
                                                            bpy.context.scene.render.resolution_y]), f)


def render_closeup(path, objs, center, size, view='front', color_type='TEXTURE', res=900, xray=False, alpha=0.5):
    """Orthographic close-up of `objs` around `center` (world), `size` metres across."""
    cam = setup_render(res)
    c = Vector(center); lo = c - Vector((size, size, size)) / 2; hi = c + Vector((size, size, size)) / 2
    place_camera(cam, lo, hi, view, center=c, size=size)
    only_visible(objs); shading(color_type, xray=xray, alpha=alpha)
    render_to(path)
    for o in bpy.context.scene.objects:
        o.hide_render = False


def shading(color_type='TEXTURE', xray=False, alpha=0.5):
    sh = bpy.context.scene.display.shading
    sh.color_type = color_type
    sh.show_xray = xray
    if xray:
        sh.xray_alpha = alpha


def only_visible(objs):
    keep = {o.name for o in objs}
    for o in bpy.context.scene.objects:
        o.hide_render = o.name not in keep


def render_views(prefix, objs, views=('front', 'left', 'back'), color_type='TEXTURE', res=900, xray=False,
                 frame_objs=None, center=None, size=None, bones=None, bone_xray_alpha=0.35):
    """Render `objs` from several views. If `bones` (a proxy object) is given, also render a bone-only
    pass '<prefix>_<view>_bones.png' with the same camera, for compositing (tools/compose.py)."""
    cam = setup_render(res)
    lo, hi = frame_box(frame_objs or objs)
    out = []
    for v in views:
        place_camera(cam, lo, hi, v, center=center, size=size)
        only_visible(objs); shading(color_type, xray=xray, alpha=bone_xray_alpha if bones else 0.5)
        p = f'{prefix}_{v}.png'; render_to(p); out.append(p)
        if bones is not None:
            only_visible([bones]); shading('VERTEX', xray=False)
            render_to(f'{prefix}_{v}_bones.png')
    for o in bpy.context.scene.objects:
        o.hide_render = False
    return out


def part_color(name, role):
    if role in PART_COLORS:
        return PART_COLORS[role]
    hsh = int(hashlib.md5(name.encode()).hexdigest()[:6], 16)
    return CLOTH_PALETTE[hsh % len(CLOTH_PALETTE)]


def render_parts(prefix, objs, views=('front', 'back', 'left', 'three_quarter'), res=1000):
    """Part-review renders: each object in its part colour (o['rig_part'] or name suffix)."""
    cloth_i = 0
    for o in objs:
        role = o.get('rig_part') or o.name.rsplit('_', 1)[-1]
        if role == 'Cloth' and o.get('rb_role', 'Cloth') != 'Cloth':      # each robe part its own colour
            c = CLOTH_PALETTE[cloth_i % len(CLOTH_PALETTE)]; cloth_i += 1
        else:
            c = part_color(o.name, role)
        o.color = (c[0], c[1], c[2], 1.0)
    return render_views(prefix, objs, views=views, color_type='OBJECT', res=res)


# ------------------------------------------------------------------ weights helpers (on top of the skill's)

def vertex_weights(ob, i):
    gn = [g.name for g in ob.vertex_groups]
    return {gn[g.group]: g.weight for g in ob.data.vertices[i].groups}


def blend(d1, d2, s):
    """(1-s)*d1 + s*d2 for weight dicts."""
    out = collections.Counter()
    for n, x in d1.items():
        out[n] += x * (1 - s)
    for n, x in d2.items():
        out[n] += x * s
    return dict(out)


def coincident_map(src, dst, tol=1e-5):
    """{src vertex: dst vertex} for vertices of src lying on a vertex of dst (world space), e.g. both sides of a cut."""
    kd = kdtree.KDTree(len(dst.data.vertices)); M = dst.matrix_world
    for v in dst.data.vertices:
        kd.insert(M @ v.co, v.index)
    kd.balance(); Ms = src.matrix_world; out = {}
    for v in src.data.vertices:
        co, j, d = kd.find(Ms @ v.co)
        if d < tol:
            out[v.index] = j
    return out


def neck_skin_from_cut(body, head, tol=1e-5, max_frac=0.05):
    """Skill neck_skin_weights, but the neck-skin islands are the Body islands sharing CUT vertices with the
    Head (coincident within tol), not 'closer than 4 mm' - on U01 the scarf sits 4.5 mm from the head and a
    distance test would turn the whole torso into neck skin. Guard: an island bigger than max_frac of the
    Body is refused. Boundary verts on the cut -> head 1, other boundary verts -> neck 1, harmonic between."""
    lab, isl = _islands(body); cut = coincident_map(body, head, tol)
    skin_isl = {lab[i] for i in cut}
    big = [k for k in skin_isl if len(isl[k]) > max_frac * len(body.data.vertices)]
    if big:
        raise RuntimeError(f'neck skin island(s) too big: {[len(isl[k]) for k in big]} verts')
    skin = [i for k in skin_isl for i in isl[k]]
    if not skin:
        return set()
    bm = bmesh.new(); bm.from_mesh(body.data); bm.verts.ensure_lookup_table()
    bnd = {i for i in skin if bm.verts[i].is_boundary}; bm.free()
    top = {i for i in bnd if i in cut}
    x = rc.harmonic_blend(body, skin, top, bnd - top)
    for i, r in x.items():
        rc.set_weights(body, i, {'head': r, 'neck': 1 - r})
    return set(skin)


def smooth_arm_blend(body, rig, verts, ones, zeros, iters=400):
    """Arm weights without a hard mask edge: for `verts` (Body vertices around the shoulder) compute the
    skill's arm-style weights (body_weights with them masked) and the plain torso weights, then blend by a
    harmonic field m (1 on `ones`, 0 on `zeros`). Call AFTER rc.body_weights; overwrites `verts`."""
    vs = list(verts); vset = set(vs)
    m = rc.harmonic_blend(body, vs, set(ones) & vset, set(zeros) & vset, iters=iters)
    Wa = {i: vertex_weights(body, i) for i in vs}               # body_weights already gave them arm style
    out = {}
    for i in vs:
        Wt = rc.torso_weights(body.data.vertices[i].co, rig)
        out[i] = blend(Wt, Wa[i], m[i])
    for i, d in out.items():
        rc.set_weights(body, i, d)
    return m


def harmonic_weights(ob, verts, fixed, iters=300):
    """Vector-valued harmonic interpolation of weight dicts over `verts` (edge neighbours), with `fixed`
    {vertex: dict} as boundary values (fixed vertices may lie outside `verts`). Returns {vertex: dict}."""
    m = ob.data; bm = bmesh.new(); bm.from_mesh(m); bm.verts.ensure_lookup_table()
    free = [i for i in verts if i not in fixed]
    nb = {i: [e.other_vert(bm.verts[i]).index for e in bm.verts[i].link_edges] for i in free}
    bm.free()
    W = {i: dict(d) for i, d in fixed.items()}
    for i in free:
        W.setdefault(i, vertex_weights(ob, i))
    for _ in range(iters):
        for i in free:
            acc = collections.Counter(); n = 0
            for j in nb[i]:
                if j in W:
                    for g, x in W[j].items():
                        acc[g] += x
                    n += 1
            if n:
                W[i] = {g: x / n for g, x in acc.items()}
    return {i: W[i] for i in free}


def head_seam_band(body, head, band):
    """Head cut out of a big Body island (hood + face + torso as one piece): Body vertices within geodesic
    distance `band` of the cut get a harmonic blend from head 1 at the cut to their own (torso) weights at the
    band's far edge, so turning the head twists the hood/collar smoothly instead of tearing at the cut."""
    cut = coincident_map(body, head)
    if not cut:
        return 0
    lbl, dist = geodesic_voronoi(body, {i: i for i in cut}, lambda i: True)
    inner = [i for i, d in dist.items() if d <= band]
    ring = [i for i, d in dist.items() if band < d <= band * 1.25]
    fixed = {i: {'head': 1.0} for i in cut}
    for i in ring:
        fixed[i] = vertex_weights(body, i)
    res = harmonic_weights(body, inner, fixed)
    for i, d in res.items():
        rc.set_weights(body, i, dict(sorted(d.items(), key=lambda t: -t[1])[:4]))
    for i in cut:
        rc.set_weights(body, i, {'head': 1.0})
    return len(res)


def head_z_band(body, head, rig, band, rr=(0.20, 0.28)):
    """Head cut out of a hood that is layered (face skin inside, cowl outside, F01): the geodesic band of
    head_seam_band reaches different depths on each layer, so head weight varies AROUND the neck and a head
    turn crushes the cowl 5x. Here head share = smoothstep in z only (band below the lowest cut vertex),
    faded out past rr (horizontal distance to the neck->head axis) so shoulders and sleeves are untouched."""
    cut = coincident_map(body, head)
    if not cut:
        return 0
    V = body.data.vertices; B = rig.data.bones
    nk = B['neck'].head_local; hd = B['head'].head_local
    z_hi = min(V[i].co.z for i in cut); z_lo = z_hi - band
    n = 0
    for v in V:
        if v.co.z <= z_lo:
            continue
        t = min(max((v.co.z - nk.z) / max(hd.z - nk.z, 1e-6), 0.0), 1.0); a = nk.lerp(hd, t)
        h = rc.sm(z_lo, z_hi, v.co.z) * (1 - rc.sm(rr[0] * K, rr[1] * K, math.hypot(v.co.x - a.x, v.co.y - a.y)))
        if v.index in cut:
            h = 1.0
        if h <= 0:
            continue
        rc.set_weights(body, v.index, dict(sorted(blend(vertex_weights(body, v.index), {'head': 1.0}, h).items(), key=lambda q: -q[1])[:4]))
        n += 1
    return n


def follow_part(dst, src, verts):
    """Like rc.follow_skin but from any part (tassels riding on the skirt take the skirt's chain weights)."""
    m = src.data; gb = [g.name for g in src.vertex_groups]; kd = kdtree.KDTree(len(m.vertices))
    for v in m.vertices:
        kd.insert(src.matrix_world @ v.co, v.index)
    kd.balance(); mw = dst.matrix_world
    for i in verts:
        j = kd.find(mw @ dst.data.vertices[i].co)[1]
        rc.set_weights(dst, i, {gb[g.group]: g.weight for g in m.vertices[j].groups})


def chain_joint_z(rig, bones):
    B = rig.data.bones
    return [B[n].head_local.z for n in bones] + [B[bones[-1]].tail_local.z]


def angular_chain_weights(co, rig, chains, angles, center, blend_z=0.06):
    """Weights of a hanging cloth vertex: the two chains nearest in angle (smoothstep between them), each
    by height along its own joints (rc.chain_weights, top->bottom)."""
    a = math.degrees(math.atan2(co.x - center[0], -(co.y - center[1])))
    def adiff(p, q): return ((p - q + 180) % 360) - 180
    order = sorted(chains, key=lambda n: abs(adiff(a, angles[n])))
    c1 = order[0]
    if len(order) == 1:
        return rc.chain_weights(chains[c1], chain_joint_z(rig, chains[c1]), co.z, blend=blend_z)
    c2 = order[1]
    d1, d2 = abs(adiff(a, angles[c1])), abs(adiff(a, angles[c2]))
    s = rc.sm(0.0, 1.0, d1 / max(d1 + d2, 1e-9)) if d1 + d2 > 0 else 0.0
    w1 = rc.chain_weights(chains[c1], chain_joint_z(rig, chains[c1]), co.z, blend=blend_z)
    w2 = rc.chain_weights(chains[c2], chain_joint_z(rig, chains[c2]), co.z, blend=blend_z)
    return blend(w1, w2, s)


def seam_band(part, body, band, tol=1e-5):
    """Vertices of `part` within geodesic distance `band` of its cut seam with `body`:
    {v: (body twin vertex of the nearest seam vertex, s in 0..1)} with s = smoothstep(0, band, distance)."""
    cut = coincident_map(part, body, tol)
    if not cut:
        return {}
    lbl, dist = geodesic_voronoi(part, {i: i for i in cut}, lambda i: True)
    out = {}
    for v, d in dist.items():
        if d <= band:
            out[v] = (cut[lbl[v]], rc.sm(0.0, band, d))
    return out


def reparent(rig, bone, parent):
    bpy.ops.object.select_all(action='DESELECT'); bpy.context.view_layer.objects.active = rig; rig.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    eb = rig.data.edit_bones; eb[bone].use_connect = False; eb[bone].parent = eb[parent]
    bpy.ops.object.mode_set(mode='OBJECT')


def hook_parent(rig, body, point, candidates=('pelvis', 'spine_01', 'spine_02'), n=8):
    """Skill rule for hanging items: parent = the candidate bone with the largest total weight on the n Body
    vertices nearest to the hook point."""
    kd = kdtree.KDTree(len(body.data.vertices)); M = body.matrix_world
    for v in body.data.vertices:
        kd.insert(M @ v.co, v.index)
    kd.balance(); acc = collections.Counter()
    for _, j, _ in kd.find_n(point, n):
        for nme, x in vertex_weights(body, j).items():
            if nme in candidates:
                acc[nme] += x
    return acc.most_common(1)[0][0] if acc else candidates[0]


# ------------------------------------------------------------------ cloth push (skill stage 5) + QA poses

def leg_radii(rig, body, pct=0.8):
    """Collider radii measured on the Body leg mesh (skill: 'ban kinh do tu mesh'): pct-quantile distance of
    the vertices nearest to each segment. Returns dict(thigh_r, knee_r, calf_r, foot_r) (both legs pooled)."""
    B = rig.data.bones; V = [body.matrix_world @ v.co for v in body.data.vertices]
    def seg(n):
        b = B[n]; return b.head_local, b.tail_local
    def dist_seg(p, a, b):
        ab = b - a; t = min(max((p - a).dot(ab) / max(ab.length_squared, 1e-12), 0.0), 1.0); return (p - (a + ab * t)).length, t
    out = collections.defaultdict(list)
    for p in V:
        best = None
        for P in 'LR':
            for kind, n in (('thigh', f'{P}_Thigh'), ('calf', f'{P}_Calf'), ('foot', f'{P}_Foot')):
                a, b = seg(n); d, t = dist_seg(p, a, b)
                if best is None or d < best[0]:
                    best = (d, kind, t, n)
        d, kind, t, n = best
        if d > 0.25 * K:
            continue
        if kind == 'calf' and t < 0.12:
            out['knee'].append(d)
        if kind == 'thigh' and t > 0.88:
            out['knee'].append(d)
        out[kind].append(d)
    def q(xs, default):
        if len(xs) < 8:
            return default
        xs = sorted(xs); return xs[int(pct * (len(xs) - 1))]
    return dict(thigh_r=round(q(out['thigh'], 0.039 * 1.8 * K), 4), knee_r=round(q(out['knee'], 0.085 * K), 4),
                calf_r=round(q(out['calf'], 0.06 * K), 4), foot_r=round(q(out['foot'], 0.05 * K), 4),
                n={kk: len(v) for kk, v in out.items()})


def push_setup(rig, cloth_obs, radii, per_bone=64, layer_cap=0.4, skip=('beads',)):
    """rc.push_setup with k-scaled distances and measured leg radii (the skill's version uses the 1.8 m
    defaults: radii 0.07/0.085/0.06/0.05, offset 0.01, layer near 0.03/0.025)."""
    k = K
    cols = rc.leg_colliders(rig, radii['thigh_r'], radii['knee_r'], radii['calf_r'], radii['foot_r'])
    chains = rc.cloth_chains(rig)
    for o in rc._obs(cloth_obs):
        rc.strip_thigh_from_cloth(o)
    S = rc.cloth_samples(cloth_obs, rig, chains, cols, per_bone=per_bone, offset=0.01 * k)
    LY = rc.cloth_layers(rig, chains, S, near=0.03 * k, center=(0.0, -0.06 * k))
    moved = rc.layer_weight_transfer(cloth_obs, rig, chains, LY['pairs'], near=0.025 * k, skip=skip, cap=layer_cap)
    S = rc.cloth_samples(cloth_obs, rig, chains, cols, per_bone=per_bone, offset=0.01 * k)
    LY = rc.cloth_layers(rig, chains, S, near=0.03 * k, center=(0.0, -0.06 * k))
    NB = rc.chain_neighbors(cloth_obs, chains)
    return dict(cols=cols, chains=chains, samples=S, neighbors=NB, layers=LY, transferred=moved)


def dangle(rig, chains, max_deg=150.0, factors=(0.6, 1.0)):
    """QA stand-in for spring bones on hanging chains (sleeve flaps): after the body pose, turn each chain
    bone so it points down again (gravity, no inertia), root first. Not exported; the game's spring bones do it."""
    M = rig.matrix_world; Mi = M.inverted(); vl = bpy.context.view_layer
    down = Vector((0, 0, -1))
    for ch in chains:
        for j, n in enumerate(ch):
            fac = factors[min(j, len(factors) - 1)]      # root turns only part way (a stiff spring at the root)
            vl.update(); pb = rig.pose.bones[n]; h = M @ pb.head; t = M @ pb.tail
            d = (t - h).normalized(); rest = (M.to_3x3() @ (rig.data.bones[n].tail_local - rig.data.bones[n].head_local)).normalized()
            target = rest if rest.dot(down) > 0.2 else down          # keep the rest direction if it already hangs
            q = d.rotation_difference(target)
            q = Quaternion().slerp(q, fac)
            if math.degrees(q.angle) > max_deg:
                q = Quaternion(q.axis, math.radians(max_deg))
            W = M @ pb.matrix
            R4 = Matrix.Translation(h) @ q.to_matrix().to_4x4() @ Matrix.Translation(-h)
            pb.matrix = Mi @ (R4 @ W)
    vl.update()


QA_POSES = {
    'arms_down': [('L_UpperArm', (0, 1, 0), 65), ('R_UpperArm', (0, 1, 0), -65)],
    'arms_up': [('L_UpperArm', (0, 1, 0), -40), ('R_UpperArm', (0, 1, 0), 40)],
    'arms_fwd': [('L_UpperArm', (0, 0, 1), 70), ('R_UpperArm', (0, 0, 1), -70)],
    'elbows': [('L_UpperArm', (0, 1, 0), 60), ('R_UpperArm', (0, 1, 0), -60), ('L_ForeArm', (0, 0, 1), -100), ('R_ForeArm', (0, 0, 1), 100)],
    'walk': [('L_Thigh', (1, 0, 0), -35), ('L_Calf', (1, 0, 0), 30), ('R_Thigh', (1, 0, 0), 20), ('R_Calf', (1, 0, 0), 25),
             ('spine_01', (0, 0, 1), 10), ('chest', (0, 0, 1), 10), ('L_UpperArm', (0, 1, 0), 55), ('R_UpperArm', (0, 1, 0), -55)],
    'knees': [('L_Calf', (1, 0, 0), 80), ('R_Calf', (1, 0, 0), 30), ('L_Foot', (1, 0, 0), -25)],
    'head_turn': [('neck', (0, 0, 1), 20), ('head', (0, 0, 1), 25)],
    'head_nod': [('neck', (1, 0, 0), 15), ('head', (1, 0, 0), 15)],
    'bend': [('spine_01', (1, 0, 0), 20), ('spine_02', (1, 0, 0), 15), ('chest', (1, 0, 0), 10)],
    'twist': [('spine_01', (0, 0, 1), 15), ('spine_02', (0, 0, 1), 15), ('chest', (0, 0, 1), 15)],
    'shrug': [('L_Clavicle', (0, 1, 0), -20), ('R_Clavicle', (0, 1, 0), 20)],
    'wrist': [('L_Hand', (0, 1, 0), 45), ('R_Hand', (0, 1, 0), -45)],
    'step_back': [('L_Thigh', (1, 0, 0), 30), ('L_Calf', (1, 0, 0), 20), ('R_Thigh', (1, 0, 0), -25)],
    'kick': [('L_Thigh', (1, 0, 0), -70), ('L_Calf', (1, 0, 0), 15)],
    'side_step': [('L_Thigh', (0, 1, 0), -25), ('R_Thigh', (0, 1, 0), 25)],
    'sit': [('L_Thigh', (1, 0, 0), -80), ('R_Thigh', (1, 0, 0), -80), ('L_Calf', (1, 0, 0), 90), ('R_Calf', (1, 0, 0), 90)],
}


def max_rest_push_deg(rig, P):
    """Skill check: at rest, skirt_push_coupled must not rotate any cloth bone (0 deg)."""
    rc.clear_pose(rig); bpy.context.view_layer.update()
    M = rig.matrix_world
    base = {n: (M @ rig.pose.bones[n].matrix).to_quaternion() for ch in P['chains'] for n in ch}
    rc.skirt_push_coupled(rig, P['chains'], P['cols'], P['samples'], P['neighbors'], layers=P['layers'])
    bpy.context.view_layer.update()
    worst = 0.0
    for n, q0 in base.items():
        q = (M @ rig.pose.bones[n].matrix).to_quaternion()
        worst = max(worst, math.degrees(q0.rotation_difference(q).angle))
    rc.clear_pose(rig); bpy.context.view_layer.update()
    return round(worst, 3)


def qa_poses(meshes, rig, P, dangle_chains=(), poses=None, render=(), out_prefix=None, views=('front', 'left'), res=800):
    """Pose -> (push) -> dangle -> numbers (+ renders). Returns {pose: {...}}; leaves the rig at rest."""
    poses = poses or QA_POSES
    cloth = [o for o in meshes if o.get('rig_part') in ('Cloth', 'Accessory') or (QA_CLOTH_BODY and o.get('rig_part') == 'Body')]
    pairs = seam_pairs(meshes, tol=1e-4)
    out = {}
    lo, hi = frame_box(meshes); size = max((hi - lo).x, (hi - lo).y, (hi - lo).z) * 1.1
    center = (lo + hi) / 2
    for name, spec in poses.items():
        rc.apply_pose(rig, spec)
        r = {}
        if P:
            r['pen_nopush'] = rc.cloth_penetration(cloth, rig, P['cols'], margin=0.005 * K)
            rc.skirt_push_coupled(rig, P['chains'], P['cols'], P['samples'], P['neighbors'], layers=P['layers'], **PUSH_KW)
        if dangle_chains:
            dangle(rig, dangle_chains)
        bpy.context.view_layer.update()
        w, n, per = stretch_all(meshes)
        r['stretch'] = round(w, 2); r['bad_edges'] = n
        top = int(os.environ.get('RB_QA_TOP', '0'))
        if top and w > 2.5:                     # diag: worst edges with both ends' main weights (push applied)
            dg = bpy.context.evaluated_depsgraph_get()
            for o in meshes:
                m = o.data; ev = o.evaluated_get(dg).to_mesh(); rows = []
                for e in m.edges:
                    a_, b_ = e.vertices; rl = (m.vertices[a_].co - m.vertices[b_].co).length
                    if rl < 0.004 * K:
                        continue
                    q = (ev.vertices[a_].co - ev.vertices[b_].co).length / rl; rows.append((max(q, 1 / max(q, 1e-6)), a_, b_))
                o.evaluated_get(dg).to_mesh_clear()
                rows.sort(key=lambda t: -t[0])
                for qq, a_, b_ in rows[:top]:
                    if qq < 2.5:
                        break
                    c = (m.vertices[a_].co + m.vertices[b_].co) / 2
                    tw = lambda i: ' '.join(f'{g}:{x:.2f}' for g, x in sorted(vertex_weights(o, i).items(), key=lambda t: -t[1])[:3])
                    print(f'  TOP {name} {o.name.rsplit("_", 1)[-1]} {qq:.2f}x at ({c.x:+.3f},{c.y:+.3f},{c.z:.3f}) | {tw(a_)} || {tw(b_)}')
        r['per_part'] = {o.rsplit('_', 1)[-1]: v for o, v in per.items()}
        if P:
            r['pen'] = rc.cloth_penetration(cloth, rig, P['cols'], margin=0.005 * K)
        r['seams'] = seam_gaps(pairs)
        out[name] = r
        if name in render and out_prefix:
            cam = setup_render(res)
            for v in views:
                place_camera(cam, lo, hi, v, center=center, size=size)
                only_visible(meshes); shading('TEXTURE')
                render_to(f'{out_prefix}_{name}_{v}.png')
            for o in meshes:
                set_point_colors(o, stretch_colors(o), name='rb_heat')
            for v in views[:1]:
                place_camera(cam, lo, hi, v, center=center, size=size)
                only_visible(meshes); shading('VERTEX')
                render_to(f'{out_prefix}_{name}_{v}_heat.png')
            for o in meshes:
                clear_point_colors(o, name='rb_heat')
            for o in bpy.context.scene.objects:
                o.hide_render = False
    rc.clear_pose(rig); bpy.context.view_layer.update()
    return out


# ------------------------------------------------------------------ QA numbers

def health_all(objs, rig):
    out = {}
    for o in objs:
        m = o.data; gn = [g.name for g in o.vertex_groups]
        nd = {b.name for b in rig.data.bones if not b.use_deform}
        unknown = {n for n in gn if n not in rig.data.bones}
        out[o.name] = dict(verts=len(m.vertices),
                           max_influences=max((len(v.groups) for v in m.vertices), default=0),
                           not_normalised=sum(1 for v in m.vertices if abs(sum(g.weight for g in v.groups) - 1) > 0.01),
                           empty=sum(1 for v in m.vertices if not v.groups),
                           on_non_deform=sum(1 for v in m.vertices if any(gn[g.group] in nd and g.weight > 0 for g in v.groups)),
                           unknown_groups=sorted(unknown))
    return out


def edge_stats(o, min_len, hi=1.6, lo=0.5):
    """Same measure as rc.stretch_report (edge length posed / rest, edges >= min_len) plus the absolute
    length change: (worst ratio as max(q, 1/q), #bad, |dlen| of the worst edge in mm, max |dlen| in mm)."""
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get(); ev = o.evaluated_get(dg).to_mesh(); m = o.data
    worst = (1.0, 0.0); bad = 0; dmax = 0.0
    for e in m.edges:
        a, b = e.vertices
        r = (m.vertices[a].co - m.vertices[b].co).length
        if r < min_len:
            continue
        d = (ev.vertices[a].co - ev.vertices[b].co).length; q = d / r; qq = max(q, 1 / max(q, 1e-6))
        dmax = max(dmax, abs(d - r))
        if q > hi or q < lo:
            bad += 1
        if qq > worst[0]:
            worst = (qq, abs(d - r))
    o.evaluated_get(dg).to_mesh_clear()
    return round(worst[0], 2), bad, round(1000 * worst[1], 1), round(1000 * dmax, 1)


def stretch_all(objs, k=None, top=0):
    k = K if k is None else k
    worst = 1.0; bad = 0; per = {}
    for o in objs:
        w, n, dw, dm = edge_stats(o, 0.004 * k)
        per[o.name] = (w, n, dw, dm); worst = max(worst, w); bad += n
    return worst, bad, per


def bone_lengths(rig):
    return {b.name: round(b.length, 4) for b in rig.data.bones}



# ------------------------------------------------------------------ packaging (end of R5)

def xray_views(prefix, meshes, rig, views=('front', 'left', 'back'), res=1100, alpha=0.28):
    """X-ray QA (skill: 'look X-ray front + right'): light flat mesh pass + bone proxy pass (composite later)."""
    proxy = bone_proxy(rig, posed=False)
    cam = setup_render(res); lo, hi = frame_box(meshes)
    sh = bpy.context.scene.display.shading
    for v in views:
        place_camera(cam, lo, hi, v)
        only_visible(meshes); sh.color_type = 'SINGLE'; sh.single_color = (0.78, 0.76, 0.72)
        sh.show_xray = True; sh.xray_alpha = alpha
        render_to(f'{prefix}_{v}.png')
        only_visible([proxy]); shading('VERTEX', xray=False)
        render_to(f'{prefix}_{v}_bones.png')
    for o in bpy.context.scene.objects:
        o.hide_render = False
    sh.show_xray = False
    bpy.data.objects.remove(proxy)


def tidy_for_user(rig):
    """Leave the file the way a user expects to open it: rest pose, object mode, textured solid view,
    no helper camera/proxy objects."""
    rc.clear_pose(rig)
    for n in ('_rb_cam', '_bone_proxy'):
        o = bpy.data.objects.get(n)
        if o:
            bpy.data.objects.remove(o)
    for scr in bpy.data.screens:
        for area in scr.areas:
            if area.type == 'VIEW_3D':
                for sp in area.spaces:
                    if sp.type == 'VIEW_3D':
                        sp.shading.type = 'SOLID'; sp.shading.color_type = 'TEXTURE'
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = rig


def polyline_chain_weights(rig, bones, p, blend):
    """Strand weights by the position ALONG the bone chain (nearest point on the bone polyline), not by height: a
    curled or bent strand (U05 tentacles moved by hand) keeps each bone on its own stretch. Returns (weights, s) with
    s = arc length from the chain root."""
    B = rig.data.bones; acc = 0.0; joints = [0.0]; best = None
    for n in bones:
        a, b = B[n].head_local, B[n].tail_local; ab = b - a; L = ab.length
        t = max(0.0, min(1.0, (p - a).dot(ab) / max(L * L, 1e-12))); d = (p - (a + ab * t)).length
        if best is None or d < best[0]:
            best = (d, acc + t * L)
        acc += L; joints.append(acc)
    s = best[1]
    return rc.chain_weights(list(bones), [-x for x in joints], -s, blend=blend), s


def sleeve_flood(body, rig, seed_r=0.06, core_x=0.0, z_min=-1e9, allowed=None):
    """Sleeve = everything connected (mesh edges) to the forearm/hand core without passing through the torso core.
    seeds: vertices within seed_r of the ForeArm/Hand segments; blocked: |x| <= core_x (the torso around the axis) and
    z < z_min; `allowed(i)` limits the fill further. Coordinate thresholds alone kept missing the part of a wide
    sleeve that hangs under the upper arm (P05, U05, D02: the user's arms dragged or left cloth behind)."""
    B = rig.data.bones; V = body.data.vertices
    segs = [(B[n].head_local, B[n].tail_local) for s in 'LR' for n in (f'{s}_ForeArm', f'{s}_Hand')]
    def d(p):
        best = 1e9
        for a, b in segs:
            ab = b - a; t = max(0.0, min(1.0, (p - a).dot(ab) / max(ab.length_squared, 1e-12))); best = min(best, (p - (a + ab * t)).length)
        return best
    ok = lambda i: abs(V[i].co.x) > core_x and V[i].co.z >= z_min and (allowed is None or allowed(i))
    nb = collections.defaultdict(list)
    for e in body.data.edges:
        a, b = e.vertices; nb[a].append(b); nb[b].append(a)
    out = {i for i in range(len(V)) if ok(i) and d(V[i].co) < seed_r}
    stack = list(out)
    while stack:
        i = stack.pop()
        for j in nb[i]:
            if j not in out and ok(j) and (V[j].co.x > 0) == (V[i].co.x > 0):
                out.add(j); stack.append(j)
    return out
