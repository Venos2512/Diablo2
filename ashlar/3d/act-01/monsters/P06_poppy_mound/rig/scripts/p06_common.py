"""Shared helpers for the P06 Poppy-Mound rig (family O, route M). Runs inside headless Blender 5.1.

Import from a stage script:
    import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import p06_common as C

- intake(): GLB (read-only, sha256 checked) -> one mesh at real size: uniform scale so the width (X) is the catalogue
  width 2.5H = 4.50 m (H = 1.8 m), bbox centred in x/y, base on z = 0, facing -Y (glTF +Z forward).
- weld map (distance weld on a bmesh copy) so weights can be smoothed across UV seams; the real mesh keeps its topology.
- render helpers come from the batch tools (rigbatch.py, imported unmodified); textures are downscaled IN MEMORY for
  QA renders (never saved that way).
"""
import bpy, bmesh, os, sys, json, math, hashlib, collections
from mathutils import Vector, Matrix, kdtree
from mathutils.bvhtree import BVHTree

HERE = os.path.dirname(os.path.abspath(__file__))
RIG = os.path.dirname(HERE)
ADIR = os.path.dirname(RIG)
AID = 'P06_poppy_mound'
GLB = os.path.join(ADIR, AID + '.glb')
REPO = os.path.abspath(os.path.join(ADIR, '..', '..', '..', '..', '..'))
TOOLS = os.path.join(REPO, 'ashlar', '3d', 'act-01', '_batches', 'rig_v1', 'tools')
QA = os.path.join(RIG, 'qa')
WORK = os.path.join(RIG, '_work')
BLEND = os.path.join(RIG, AID + '_rig.blend')
H = 1.8
WIDTH_M = 2.5 * H                     # catalogue: "rong 2,5H"
GLB_SHA = '76737dd98af611f559ced9f9970e1320c0f9ec3664c81d44c36215f36f55b75b'
WELD = 1e-4                           # m, distance weld for the smoothing graph (real scale)

sys.dont_write_bytecode = True        # never write __pycache__ into the shared batch tools folder
if TOOLS not in sys.path:
    sys.path.insert(0, TOOLS)
import rigbatch as rb                 # batch helpers (render, proxies, colours); the skill is NOT loaded


def log(*a):
    print('[p06]', *a, flush=True)


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def args():
    return sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []


def intake(width_m=WIDTH_M, name=AID):
    """Fresh scene with the GLB as one mesh `name` at real size. Returns (ob, info)."""
    sha = sha256(GLB)
    assert sha == GLB_SHA, f'GLB changed: {sha}'
    bpy.ops.wm.read_factory_settings(use_empty=True)
    rb.prefs()
    bpy.ops.import_scene.gltf(filepath=GLB, merge_vertices=True)
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
    ob = meshes[0]; ob.name = name; ob.data.name = name + '_mesh'
    me = ob.data
    xs = [v.co.x for v in me.vertices]; W0 = max(xs) - min(xs)
    s = width_m / W0
    me.transform(Matrix.Scale(s, 4))
    xs = [v.co.x for v in me.vertices]; ys = [v.co.y for v in me.vertices]; zs = [v.co.z for v in me.vertices]
    off = Vector(((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, min(zs)))
    me.transform(Matrix.Translation(-off))
    me.update()
    xs = [v.co.x for v in me.vertices]; ys = [v.co.y for v in me.vertices]; zs = [v.co.z for v in me.vertices]
    info = dict(glb=os.path.relpath(GLB, REPO).replace('\\', '/'), sha256=sha, glb_width=round(W0, 6), scale=round(s, 6),
                width_m=round(max(xs) - min(xs), 4), depth_m=round(max(ys) - min(ys), 4), height_m=round(max(zs), 4),
                verts=len(me.vertices), faces=len(me.polygons), tris=sum(len(p.vertices) - 2 for p in me.polygons),
                offset=[round(c, 6) for c in off], images=[dict(name=i.name, size=list(i.size)) for i in bpy.data.images])
    ob['p06_intake'] = json.dumps(info)
    return ob, info


def weld_map(ob, dist=WELD):
    """Distance weld on a bmesh copy. Returns (rep, groups, nbrs, wco):
    rep[i] = welded id of vertex i, groups[w] = vertex ids, nbrs[w] = welded neighbour ids, wco[w] = position."""
    me = ob.data
    kd = kdtree.KDTree(len(me.vertices))
    for v in me.vertices:
        kd.insert(v.co, v.index)
    kd.balance()
    rep = [-1] * len(me.vertices); groups = []
    for v in me.vertices:
        if rep[v.index] >= 0:
            continue
        w = len(groups); g = []
        for (co, j, d) in kd.find_range(v.co, dist):
            if rep[j] < 0:
                rep[j] = w; g.append(j)
        groups.append(g)
    nb = [set() for _ in groups]
    for e in me.edges:
        a, b = rep[e.vertices[0]], rep[e.vertices[1]]
        if a != b:
            nb[a].add(b); nb[b].add(a)
    wco = [sum((me.vertices[i].co for i in g), Vector()) / len(g) for g in groups]
    return rep, groups, [sorted(s) for s in nb], wco


def welded_islands(nbrs):
    lab = [-1] * len(nbrs); out = []
    for s in range(len(nbrs)):
        if lab[s] >= 0:
            continue
        k = len(out); lab[s] = k; st = [s]; comp = []
        while st:
            a = st.pop(); comp.append(a)
            for b in nbrs[a]:
                if lab[b] < 0:
                    lab[b] = k; st.append(b)
        out.append(comp)
    return lab, out


def bvh(ob, dg=None):
    if dg is None:
        return BVHTree.FromPolygons([v.co.copy() for v in ob.data.vertices], [list(p.vertices) for p in ob.data.polygons])
    ev = ob.evaluated_get(dg)
    return BVHTree.FromObject(ev, dg)


def downscale_textures(px=1024):
    """QA renders only: shrink every image in memory (never save the file afterwards)."""
    for im in bpy.data.images:
        if im.size[0] > px:
            im.scale(px, px)


def project(scene, cam, co):
    from bpy_extras.object_utils import world_to_camera_view
    p = world_to_camera_view(scene, cam, Vector(co))
    return p.x, p.y, p.z


def write_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=1, ensure_ascii=False)
    log('wrote', path)


# ------------------------------------------------------------------ landmarks and the bone table (family O)

# Sleeper faces, picked on the R1 orthographic renders (rig/_work/r1_*_tex.png, 1100 px, 4.86 m across) and
# raycast onto the body: (ray origin, ray direction). Front face at x +0.16; side faces at y +0.29 / +0.31.
FACE_RAYS = {'front': ((0.155, -10.0, 0.56), (0, 1, 0)),
             'L': ((10.0, 0.287, 0.474), (-1, 0, 0)),
             'R': ((-10.0, 0.309, 0.497), (1, 0, 0))}
FLANK_DEPTH = 0.50      # m, flank bone head inside the surface (pivot of a face "stir")
CROWN_HEAD_Z = 0.42     # m, crown pivot (inside the mound); body bone runs from the floor to here
GROUP_X = 0.35          # |x| of a flower head beyond which it belongs to L_bloom / R_bloom


def classify(ob):
    """Welded islands: body (largest) + flora. Returns dict with per-vertex island rank, flora rows and groups."""
    me = ob.data
    rep, groups, nbrs, wco = weld_map(ob)
    wlab, wisl = welded_islands(nbrs)
    order = sorted(range(len(wisl)), key=lambda k: -len(wisl[k]))
    rank = {k: r for r, k in enumerate(order)}
    vis = [rank[wlab[rep[i]]] for i in range(len(me.vertices))]
    import numpy as np
    bb = body_bvh(ob, vis)
    flora = []
    for r, k in enumerate(order[1:], start=1):
        P = [wco[w] for w in wisl[k]]
        A = np.array([[p.x, p.y, p.z] for p in P]); c = A.mean(0)
        S = np.linalg.svd(A - c, compute_uv=False) / math.sqrt(max(len(P) - 1, 1))
        lo = min(P, key=lambda p: p.z); hi = max(P, key=lambda p: p.z)
        dist = [bb.find_nearest(p)[3] for p in P]
        j = min(range(len(P)), key=lambda i: dist[i])
        attach = P[j].copy()                       # where the piece meets the mound (stem base)
        z0, z1 = attach.z, hi.z
        top = [p for p in P if p.z >= z0 + 0.6 * (z1 - z0)] or [hi]
        head = sum(top, Vector()) / len(top)
        # leaf: flat (3rd spread < 0.3 x 2nd; R2: island 3, a thick leaf clump, was 'flower' at 0.2 in the G1 proposal)
        kind = 'leaf' if S[2] < 0.3 * S[1] else ('bud' if S[0] > 2.2 * S[1] and len(P) < 60 else 'flower')
        flora.append(dict(id=r, n=len(P), kind=kind, lo=lo.copy(), hi=hi.copy(), head=head, attach=attach,
                          near_frac=sum(1 for x in dist if x < 0.03) / len(P), welded=list(wisl[k]),
                          c=Vector(c.tolist()), sd=[float(s) for s in S]))
    main = max(flora, key=lambda f: f['hi'].z)
    for f in flora:
        f['group'] = 'main' if f is main else ('L' if f['head'].x > GROUP_X else ('R' if f['head'].x < -GROUP_X else 'C'))
    return dict(rep=rep, groups=groups, nbrs=nbrs, wco=wco, vis=vis, flora=flora, main=main['id'])


def body_bvh(ob, vis):
    me = ob.data
    faces = [list(p.vertices) for p in me.polygons if vis[p.vertices[0]] == 0]
    return BVHTree.FromPolygons([v.co.copy() for v in me.vertices], faces)


def landmarks(ob, cls):
    me = ob.data; vis = cls['vis']
    bb = body_bvh(ob, vis)
    BP = [me.vertices[i].co for i in range(len(me.vertices)) if vis[i] == 0]
    zmax = max(p.z for p in BP)
    cap = [p for p in BP if p.z > 0.75 * zmax]
    cc = sum(cap, Vector()) / len(cap)
    def down(x, y):
        hit = bb.ray_cast(Vector((x, y, 10.0)), Vector((0, 0, -1)))
        return hit[0]
    top = down(cc.x, cc.y)
    L = dict(zmax=zmax, cap_centre=Vector((cc.x, cc.y, 0)), crown_top=top)
    faces = {}
    for k, (o, d) in FACE_RAYS.items():
        hit = bb.ray_cast(Vector(o), Vector(d))
        faces[k] = hit[0]
    hb = bb.ray_cast(Vector((cc.x, 10.0, 0.45)), Vector((0, -1, 0)))
    faces['back'] = hb[0]
    L['faces'] = faces
    fl = cls['flora']
    def mean(P):
        return sum(P, Vector()) / len(P)
    G = {}
    for g in ('C', 'L', 'R'):
        stems = [f for f in fl if f['group'] == g and f['kind'] != 'leaf']
        if stems:
            base = mean([f['attach'] for f in stems]); head = mean([f['head'] for f in stems])
            s = down(base.x, base.y)
            if s is not None:
                base = Vector((base.x, base.y, min(base.z, s.z)))
            sp = max(stems, key=lambda f: (f['kind'] == 'flower', f['hi'].z))
            G[g] = dict(base=base, head=head, ids=[f['id'] for f in stems],
                        leaves=[f['id'] for f in fl if f['group'] == g and f['kind'] == 'leaf'],
                        spawn=sp['head'], spawn_id=sp['id'])
    m = next(f for f in fl if f['id'] == cls['main'])
    G['main'] = dict(base=m['attach'], head=m['head'], ids=[m['id']], spawn=m['head'], spawn_id=m['id'])
    L['blooms'] = G
    return L


def bone_table(L):
    """Runtime skeleton (family O): name, head, tail, parent, deform, roll target (local Z points at it)."""
    cc = L['cap_centre']; top = L['crown_top']; F = L['faces']; G = L['blooms']
    up = Vector((0, 0, 1)); fw = Vector((0, -1, 0))
    T = []
    def B(n, h, t, par, deform=True, roll=fw):
        T.append(dict(name=n, head=Vector(h), tail=Vector(t), parent=par, deform=deform, roll=Vector(roll)))
    B('root', (0, 0, 0), (0, 0.4, 0), None, deform=False, roll=up)
    chead = Vector((cc.x, cc.y, CROWN_HEAD_Z))
    B('body', (cc.x, cc.y, 0.0), chead, 'root')
    B('crown', chead, (cc.x, cc.y, top.z), 'body')
    for name, k in (('flank_front', 'front'), ('L_flank', 'L'), ('R_flank', 'R'), ('flank_back', 'back')):
        p = F[k]; d = Vector((p.x - cc.x, p.y - cc.y, 0)).normalized()
        B(name, p - d * FLANK_DEPTH, p, 'body', roll=up)
    B('bloom_center', G['C']['base'], G['C']['head'], 'crown')
    B('bloom_main', G['main']['base'], G['main']['head'], 'bloom_center')
    B('L_bloom', G['L']['base'], G['L']['head'], 'crown')
    B('R_bloom', G['R']['base'], G['R']['head'], 'crown')
    for n, g, par in (('fx_spawn_main', 'main', 'bloom_main'), ('fx_spawn_L', 'L', 'L_bloom'), ('fx_spawn_R', 'R', 'R_bloom')):
        s = G[g]['spawn']; B(n, s, s + Vector((0, 0, 0.15)), par, deform=False)
    B('fx_body', (cc.x, cc.y, 0.6), (cc.x, cc.y, 0.75), 'crown', deform=False)
    return T


def build_rig(T, name=AID + '_Rig'):
    arm = bpy.data.armatures.new(name + '_data'); rig = bpy.data.objects.new(name, arm)
    bpy.context.scene.collection.objects.link(rig)
    bpy.ops.object.select_all(action='DESELECT'); bpy.context.view_layer.objects.active = rig; rig.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT'); eb = arm.edit_bones
    for b in T:
        e = eb.new(b['name']); e.head = b['head']; e.tail = b['tail']; e.use_deform = b['deform']
        if b['parent']:
            e.parent = eb[b['parent']]; e.use_connect = False
        e.align_roll(b['roll'])
    bpy.ops.object.mode_set(mode='OBJECT')
    arm.display_type = 'STICK'; rig.show_in_front = True
    return rig


def table_json(T):
    return [dict(name=b['name'], head=[round(x, 4) for x in b['head']], tail=[round(x, 4) for x in b['tail']],
                 parent=b['parent'], deform=b['deform'], length=round((b['tail'] - b['head']).length, 4)) for b in T]
