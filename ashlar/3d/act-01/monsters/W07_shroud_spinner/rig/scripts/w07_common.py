"""Shared helpers for the W07 Shroud-Spinner rig scripts (inside headless Blender 5.1).

Paths, intake of the source GLB at real height (raw topology kept: no welding, so the rig mesh stays
vertex-for-vertex the scaled GLB), a position-weld map for analysis/weights (co-located vertices share
one weight row, so UV seams never open), welded islands. Rendering and QA helpers come from the rig_v1
batch module `rigbatch` (imported, not modified).
"""
import bpy, bmesh, os, sys, json, math, hashlib
from mathutils import Vector, Matrix, kdtree

ASSET = 'W07_shroud_spinner'
ADIR = 'D:/Claude/Diablo2/ashlar/3d/act-01/monsters/W07_shroud_spinner'
RIG = ADIR + '/rig'
WORK = RIG + '/_work'
QA = RIG + '/qa'
GLB = ADIR + '/W07_shroud_spinner.glb'
GLB_SHA = 'f06c10637ec66a98ece9b05af34d4f92a37b4183218b213070c75307392396b3'
H_UNIT = 1.8                 # H = adult human height (m)
HEIGHT_H = 0.8               # catalogue: ~0.8H tall (top of abdomen), leg span ~1.55H
HEIGHT_M = HEIGHT_H * H_UNIT
TOOLS = 'D:/Claude/Diablo2/ashlar/3d/act-01/_batches/rig_v1/tools'
if TOOLS not in sys.path:
    sys.path.insert(0, TOOLS)
import rigbatch as rb        # noqa: E402  (render / colour / stretch helpers; skill NOT loaded)


def script_args():
    a = sys.argv
    return a[a.index('--') + 1:] if '--' in a else []


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def import_scaled(height_m=HEIGHT_M, check_sha=True):
    """Fresh scene with the GLB as one mesh object at real height. Returns (ob, info).
    Raw import (merge_vertices=False): vertex order/count = the GLB primitive, transforms applied,
    uniform scale so the z-extent = height_m, z min = 0. x/y are NOT re-centred (the GLB is already
    centred and mirror-symmetric about x = 0; recorded in info)."""
    if check_sha:
        got = sha256(GLB)
        assert got == GLB_SHA, f'source GLB changed: {got}'
    bpy.ops.wm.read_factory_settings(use_empty=True)
    rb.prefs()
    bpy.ops.import_scene.gltf(filepath=GLB, merge_vertices=False)
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    assert len(meshes) == 1, f'expected 1 mesh, got {len(meshes)}'
    ob = meshes[0]
    node_matrix = [list(r) for r in ob.matrix_world]
    M = ob.matrix_world.copy(); ob.parent = None; ob.data.transform(M); ob.matrix_world.identity()
    for o in [o for o in bpy.data.objects if o.type != 'MESH']:
        bpy.data.objects.remove(o)
    me = ob.data
    zs = [v.co.z for v in me.vertices]; z0, z1 = min(zs), max(zs)
    s = height_m / (z1 - z0)
    me.transform(Matrix.Translation((0, 0, -z0)))
    me.transform(Matrix.Scale(s, 4))
    me.update()
    ob.name = ASSET; me.name = ASSET + '_mesh'
    xs = [v.co.x for v in me.vertices]; ys = [v.co.y for v in me.vertices]
    info = dict(glb=GLB, sha256=GLB_SHA, glb_height=z1 - z0, glb_zmin=z0, scale=s, height_m=height_m,
                verts=len(me.vertices), faces=len(me.polygons), loops=len(me.loops),
                node_matrix=node_matrix,
                bbox=dict(x=[min(xs), max(xs)], y=[min(ys), max(ys)], z=[0.0, height_m]),
                images=[dict(name=i.name, size=list(i.size), packed=bool(i.packed_file)) for i in bpy.data.images
                        if i.source == 'FILE'])
    return ob, info


def weld_map(ob, dist=1e-5):
    """rep[i] = smallest index of the vertices within `dist` of vertex i (union-find). Returns (rep, reps)."""
    me = ob.data; n = len(me.vertices)
    kd = kdtree.KDTree(n)
    for v in me.vertices:
        kd.insert(v.co, v.index)
    kd.balance()
    parent = list(range(n))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]; i = parent[i]
        return i
    for v in me.vertices:
        for (_co, j, _d) in kd.find_range(v.co, dist):
            a, b = find(v.index), find(j)
            if a != b:
                parent[max(a, b)] = min(a, b)
    rep = [find(i) for i in range(n)]
    reps = sorted(set(rep))
    return rep, reps


def welded_islands(ob, rep):
    """Islands of the welded mesh. Returns (island id per ORIGINAL vertex, list of rep-index lists)."""
    me = ob.data; n = len(me.vertices)
    parent = list(range(n))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]; i = parent[i]
        return i
    for e in me.edges:
        a, b = find(rep[e.vertices[0]]), find(rep[e.vertices[1]])
        if a != b:
            parent[max(a, b)] = min(a, b)
    root = [find(rep[i]) for i in range(n)]
    roots = sorted(set(root), key=lambda r: -sum(1 for x in set(rep) if find(x) == r))
    rid = {r: k for k, r in enumerate(roots)}
    lab = [rid[r] for r in root]
    groups = [[] for _ in roots]
    for r in sorted(set(rep)):
        groups[rid[find(r)]].append(r)
    order = sorted(range(len(groups)), key=lambda k: -len(groups[k]))
    remap = {old: new for new, old in enumerate(order)}
    lab = [remap[x] for x in lab]
    groups = [groups[k] for k in order]
    return lab, groups


def jdump(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)


def project_points(points, res):
    """World points -> normalised image coords (u, v) for the scene camera (for PIL labels)."""
    from bpy_extras.object_utils import world_to_camera_view
    scn = bpy.context.scene; cam = scn.camera
    out = []
    for p in points:
        c = world_to_camera_view(scn, cam, Vector(p))
        out.append((c.x, c.y, c.z))
    return out
