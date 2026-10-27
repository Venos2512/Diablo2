"""B01 Sexton's Dog rig: paths, real-size constants and the intake shared by every b01_* script.

Runs inside headless Blender 5.1 (bpy) except the constants, which plain Python can import too.
The GLB is read only. All outputs go to ashlar/3d/act-01/monsters/B01_sextons_dog/rig/.
"""
import os, sys, json

HERE = os.path.dirname(os.path.abspath(__file__))
RIG = os.path.dirname(HERE)
ADIR = os.path.dirname(RIG)
ROOT = os.path.abspath(os.path.join(ADIR, '..', '..', '..', '..', '..'))
AID = 'B01_sextons_dog'
GLB = os.path.join(ADIR, AID + '.glb')
TOOLS = os.path.join(ROOT, 'ashlar', '3d', 'act-01', '_batches', 'rig_v1', 'tools')   # imported, never edited
WORK = os.path.join(RIG, '_work')
QA = os.path.join(RIG, 'qa')
BLEND = os.path.join(RIG, AID + '_rig.blend')
LANDMARKS = os.path.join(RIG, 'landmarks.json')
GLB_SHA256 = 'cbb68b646b1dd01fbdc86166fb579fd0ad94650aca4a0b06118ad4dc5c098ac4'

H = 1.8                      # adult human height (project H)
# Real size (G1 proposal): the catalogue length 1.2 H = 2.16 m is the GLB's long side (nose to tail tip, Y).
# Scale is uniform; the result is ~1.29 m tall at the shoulder fur (design.txt: 0.72 H incl. fur).
TARGET_LENGTH_M = 1.2 * H


def scale_override():
    """Optional override (env B01_LENGTH_M) so a different G1 decision re-runs without editing code."""
    v = os.environ.get('B01_LENGTH_M')
    return float(v) if v else TARGET_LENGTH_M


def intake(length_m=None, merge=True):
    """Fresh scene with the GLB as ONE mesh 'B01_sextons_dog': node transforms applied, UV-seam duplicates
    merged by the importer (merge_vertices), uniformly scaled so the Y extent (nose..tail tip) is length_m,
    bbox centred in x and y, lowest vertex on z = 0. Faces -Y (glTF +Z forward); the dog's left is +X."""
    import bpy
    from mathutils import Matrix, Vector
    length_m = length_m or scale_override()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.import_scene.gltf(filepath=GLB, merge_vertices=merge)
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    for o in meshes:
        M = o.matrix_world.copy(); o.parent = None; o.data.transform(M); o.matrix_world.identity()
    for o in [o for o in bpy.data.objects if o.type != 'MESH']:
        bpy.data.objects.remove(o)
    assert len(meshes) == 1, f'expected 1 mesh, got {len(meshes)}'
    ob = meshes[0]; ob.name = AID; ob.data.name = AID + '_mesh'
    me = ob.data
    ys = [v.co.y for v in me.vertices]
    L0 = max(ys) - min(ys)
    s = length_m / L0
    me.transform(Matrix.Scale(s, 4))
    xs = [v.co.x for v in me.vertices]; ys = [v.co.y for v in me.vertices]; z0 = min(v.co.z for v in me.vertices)
    off = Vector(((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, z0))
    me.transform(Matrix.Translation(-off))
    me.update()
    zs = [v.co.z for v in me.vertices]
    info = dict(glb=GLB.replace('\\', '/'), glb_long_side=L0, scale=s, length_m=length_m,
                height_m=max(zs) - min(zs), verts=len(me.vertices), faces=len(me.polygons), offset=list(off))
    ob['b01_intake'] = json.dumps(info)
    return ob, info


def texture_limit(px=1024):
    """Lighter GPU textures for QA renders (8 rig threads share the machine). Session-only preference."""
    import bpy
    try:
        bpy.context.preferences.system.gl_texture_limit = f'CLAMP_{px}'
    except Exception as e:     # noqa: BLE001 - preference names differ between builds
        print('[b01] texture limit not set:', e)


def tools_path():
    if TOOLS not in sys.path:
        sys.path.insert(0, TOOLS)


def jdump(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, indent=1, ensure_ascii=False)


def jload(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)
