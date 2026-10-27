"""Shared paths and helpers for the U04 Charnel Ghoul rig (runs inside headless Blender 5.1).

The source GLB is read only. All outputs go under <asset>/rig/. Render helpers come from the rig_v1 batch
(tools/rigbatch.py, imported unmodified).
"""
import bpy, bmesh, os, sys, json, math, hashlib, collections
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
RIG = os.path.dirname(HERE)
ASSET = os.path.dirname(RIG)
AID = 'U04_charnel_ghoul'
GLB = os.path.join(ASSET, AID + '.glb')
GLB_SHA256 = '49f607df0428a806e5bff22fb9c30cbf2b50395911939b184b4e228397fc5c4f'
QA = os.path.join(RIG, 'qa')
WORK = os.path.join(RIG, '_work')
BLEND = os.path.join(RIG, AID + '_rig.blend')
TOOLS = os.path.normpath(os.path.join(ASSET, '..', '..', '_batches', 'rig_v1', 'tools'))
H_REF = 1.8                     # H = adult human height (m)

if TOOLS not in sys.path:
    sys.path.insert(0, TOOLS)
import rigbatch as rb           # noqa: E402  (render / proxy / colour helpers, not the skill)


def log(*a):
    print('[u04]', *a, flush=True)


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def argv():
    return sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []


def import_glb(scale=1.0, name=AID, tex_max=1024):
    """Fresh scene with the GLB as ONE mesh object: node transforms applied, importer weld (merge_vertices),
    uniform scale about the origin (the GLB is already centred in x/y with soles on z = 0).
    Textures are downscaled in memory to tex_max for light renders (the file on disk is untouched)."""
    assert sha256(GLB) == GLB_SHA256, 'source GLB changed'
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.import_scene.gltf(filepath=GLB, merge_vertices=True)
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    for o in meshes:
        M = o.matrix_world.copy(); o.parent = None; o.data.transform(M); o.matrix_world.identity()
    for o in [o for o in bpy.data.objects if o.type != 'MESH']:
        bpy.data.objects.remove(o)
    assert len(meshes) == 1, f'expected 1 mesh, got {len(meshes)}'
    ob = meshes[0]; ob.name = name; ob.data.name = name + '_mesh'
    if scale != 1.0:
        ob.data.transform(Matrix.Scale(scale, 4))
    ob.data.update()
    if tex_max:
        for im in bpy.data.images:
            if im.size[0] > tex_max:
                im.scale(tex_max, tex_max)
    return ob


def weld_ids(ob, tol=1e-5):
    """Position weld: vertex -> welded id (co-located vertices share an id)."""
    key = {}; out = []
    for v in ob.data.vertices:
        k = (round(v.co.x / tol), round(v.co.y / tol), round(v.co.z / tol))
        out.append(key.setdefault(k, len(key)))
    return out, len(key)


def welded_islands(ob, wid=None):
    """Edge-connected islands after the position weld -> (label per vertex, list of vertex index lists),
    largest first."""
    if wid is None:
        wid, _ = weld_ids(ob)
    n = max(wid) + 1; par = list(range(n))

    def f(a):
        while par[a] != a:
            par[a] = par[par[a]]; a = par[a]
        return a
    for e in ob.data.edges:
        a, b = f(wid[e.vertices[0]]), f(wid[e.vertices[1]])
        if a != b:
            par[a] = b
    groups = collections.defaultdict(list)
    for i, w in enumerate(wid):
        groups[f(w)].append(i)
    isl = sorted(groups.values(), key=len, reverse=True)
    lab = [0] * len(wid)
    for k, c in enumerate(isl):
        for i in c:
            lab[i] = k
    return lab, isl


def section_loops(points_of_face, faces, axis, value, min_len=0.0):
    """Exact plane section -> closed/open polylines as point lists. faces: iterable of vertex index tuples,
    points_of_face: list of Vector per vertex. Endpoints are joined by rounding to 1e-6."""
    ai = 'xyz'.index(axis); segs = []
    for f in faces:
        pts = [points_of_face[i] for i in f]; ds = [p[ai] - value for p in pts]; cut = []
        n = len(pts)
        for i in range(n):
            a, b = pts[i], pts[(i + 1) % n]; da, db = ds[i], ds[(i + 1) % n]
            if (da < 0) != (db < 0):
                cut.append(a.lerp(b, da / (da - db)))
        if len(cut) >= 2:
            segs.append((cut[0], cut[1]))
    # join
    def key(p):
        return (round(p.x, 6), round(p.y, 6), round(p.z, 6))
    adj = collections.defaultdict(list)
    for si, (p, q) in enumerate(segs):
        adj[key(p)].append(si); adj[key(q)].append(si)
    used = [False] * len(segs); loops = []
    for si in range(len(segs)):
        if used[si]:
            continue
        # flood over segments sharing endpoints
        comp = []; st = [si]; used[si] = True
        while st:
            s = st.pop(); comp.append(s)
            for p in segs[s]:
                for t in adj[key(p)]:
                    if not used[t]:
                        used[t] = True; st.append(t)
        L = sum((segs[s][1] - segs[s][0]).length for s in comp)
        if L < min_len:
            continue
        c = Vector()
        for s in comp:
            c += (segs[s][0] + segs[s][1]) / 2 * (segs[s][1] - segs[s][0]).length
        c /= max(L, 1e-12)
        P = [p for s in comp for p in segs[s]]
        loops.append(dict(c=c, n=len(comp), length=L, lo=Vector((min(p.x for p in P), min(p.y for p in P), min(p.z for p in P))),
                          hi=Vector((max(p.x for p in P), max(p.y for p in P), max(p.z for p in P))), segs=[segs[s] for s in comp]))
    return loops


def r(v, n=4):
    if isinstance(v, (list, tuple, Vector)):
        return [round(float(x), n) for x in v]
    return round(float(v), n)


def save_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=1, ensure_ascii=False)
    log('wrote', path)
