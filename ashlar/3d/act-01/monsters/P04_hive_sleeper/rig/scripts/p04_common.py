"""P04 Hive-Sleeper rig: shared definitions (landmarks, bone table, roll rule, scale, import). Imported by stage scripts.

Frame (Blender): Z up, the creature faces -Y (head and hands at -Y, feet at +Y), its left side is +X. Landmarks are
measured on the GLB in Tripo units (longest edge 1 m) and scaled by S to real size (top of the front dome = 1.08 m =
0.60H, H = 1.8 m; G1 proposal). Bone names follow SKELETON_STANDARD.md (H core) and the Qh layout shared with U04
Charnel Ghoul (neck_02, L/R_Finger, cog mid-trunk, roll rule below); rest = the mesh's crawl pose.

Roll rule (same as U04's u04_layout.roll_vector): every bone's local X is world +X projected off the bone, so sagittal
bending (crawl swing, head up/down, knee, elbow) is a rotation about local X on both sides; bones lying along X
(clavicles) keep local Z up. Mirror-consistent (same axes as Blender's symmetrize).
"""
import os, sys, json, math
from mathutils import Vector

ASSET = 'P04_hive_sleeper'
ROOT = r'D:/Claude/Diablo2/ashlar/3d/act-01/monsters/P04_hive_sleeper'
GLB = ROOT + '/P04_hive_sleeper.glb'
RIG_DIR = ROOT + '/rig'
WORK = RIG_DIR + '/_work'
QA = RIG_DIR + '/qa'
TOOLS = r'D:/Claude/Diablo2/ashlar/3d/act-01/_batches/rig_v1/tools'
GLB_TOP = 0.6147            # Tripo height (top of the front dome), measured
TOP_M = 1.08                # real top height: 0.60H (catalogue "lưng 0,60H"), G1 proposal
S = TOP_M / GLB_TOP         # 1.757 m per Tripo unit
H_REF = 1.8

# ------------------------------------------------------------------ landmarks (Tripo units, left side x > 0)
# measured on sections/renders of rig/_work/probe (p00_probe.py, p01_regions.py, hand close-ups)
LM = {
    # trunk (x = 0), from the hips (+Y) to the neck (-Y), in the upper third of the trunk (belly hangs to z 0.09)
    'pelvis':     (0.0, 0.105, 0.335),     # between the hip joints, 2 cm (Tripo) dorsal
    'spine1':     (0.0, 0.020, 0.350),
    'spine2':     (0.0, -0.070, 0.370),    # middle dome sits on spine_02
    'chest':      (0.0, -0.190, 0.390),
    'neck':       (0.0, -0.315, 0.425),    # C7, level with the humeral heads
    'neck2':      (0.0, -0.352, 0.418),    # half way to the atlas (shared Qh layout with U04)
    'head':       (0.0, -0.390, 0.410),    # atlas: under the skull centre, ~6 cm (real) behind the face surface
    'head_top':   (0.0, -0.423, 0.505),    # crown under the hood; face plane tilted 19 deg (looks forward-down)
    # arm (vertical, hand flat on the floor, fingers forward; elbow points back +Y)
    'clav_in':    (0.030, -0.330, 0.370),
    'shoulder':   (0.135, -0.315, 0.405),  # humeral head: upper-arm tube centre, 2.5 cm (Tripo) under its open top
    'elbow':      (0.135, -0.312, 0.245),  # dense edge rings + olecranon bump; pre-bent 1.6 cm behind the line
    'wrist':      (0.138, -0.343, 0.052),  # wrist crease (hand close-up)
    'knuckle':    (0.155, -0.430, 0.022),  # MCP line of the middle finger
    'finger_end': (0.160, -0.495, 0.006),  # middle fingertip
    # leg (thigh vertical, knee on the floor, shin and foot flat behind, sole up)
    'hip':        (0.095, 0.095, 0.315),
    'knee':       (0.095, 0.085, 0.070),
    'ankle':      (0.100, 0.335, 0.065),
    'ball':       (0.100, 0.440, 0.045),
    'toe':        (0.090, 0.488, 0.035),
    # larval domes: fitted sphere centre (bone head) and top (bone tail), front -> rear (p04_skinmodel.domes, R3 run 1:
    # real centres (0,-0.441,0.855) r 0.218, (0,-0.185,0.808) r 0.167, (0,0.097,0.688) r 0.166)
    'dome1_c':    (0.0, -0.2509, 0.4865), 'dome1_t': (0.0, -0.2509, 0.6104),
    'dome2_c':    (0.0, -0.1051, 0.4598), 'dome2_t': (0.0, -0.1051, 0.5550),
    'dome3_c':    (0.0, 0.0554, 0.3915),  'dome3_t': (0.0, 0.0554, 0.4861),
}
# shirt chains, 2 bones each: (top, mid, bottom) in Tripo units on the left side (L_ chains mirrored to R_)
CHAINS = {
    'shirt_front':    dict(pts=[(0.0, -0.375, 0.375), (0.0, -0.325, 0.270), (0.0, -0.275, 0.165)], parent='chest', side=False),
    'shirt_shoulder': dict(pts=[(0.175, -0.245, 0.430), (0.205, -0.245, 0.280), (0.215, -0.245, 0.120)], parent='Clavicle', side=True),
    'shirt_flank':    dict(pts=[(0.165, 0.000, 0.380), (0.195, 0.010, 0.250), (0.205, 0.020, 0.110)], parent='spine_01', side=True),
    'shirt_back':     dict(pts=[(0.065, 0.170, 0.360), (0.075, 0.230, 0.230), (0.080, 0.275, 0.100)], parent='pelvis', side=True),
}
DOME_PARENT = {1: 'chest', 2: 'spine_02', 3: 'pelvis'}


def real(p):
    return Vector(p) * S


def mir(p, s):
    return Vector((p[0] * s, p[1], p[2]))


def roll_vector(head, tail):
    """Z target for align_roll so that local X ~ world +X (bones along X, i.e. clavicles: Z up)."""
    y = (Vector(tail) - Vector(head)).normalized()
    z = Vector((1, 0, 0)).cross(y)
    if z.length < 0.35:
        return Vector((0, 0, 1))
    return z.normalized()


def bone_table():
    """[dict(name, head, tail, parent, connect, deform, kind)] in REAL metres. kind: core | qh | extra | cloth | socket."""
    L = {k: real(v) for k, v in LM.items()}
    out = []
    def B(n, h, t, par=None, conn=False, deform=True, kind='core'):
        out.append(dict(name=n, head=Vector(h), tail=Vector(t), parent=par, connect=conn, deform=deform, kind=kind))
    cog = L['pelvis'].lerp(L['chest'], 0.5); cog.x = 0.0
    B('root', (0, 0, 0), (0, 0.25, 0), deform=False)
    B('ground', (0, 0, 0), (0, 0.12, 0), 'root', deform=False, kind='socket')
    hit = Vector((0, real((0, -0.520, 0))[1], L['head'].z))
    B('hit_origin', hit, hit + Vector((0, -0.10, 0)), 'root', deform=False, kind='socket')
    B('cog', cog, cog + Vector((0, 0.15, 0)), 'root', deform=False)
    B('pelvis', L['pelvis'], L['spine1'], 'cog')
    B('spine_01', L['spine1'], L['spine2'], 'pelvis', True)
    B('spine_02', L['spine2'], L['chest'], 'spine_01', True)
    B('chest', L['chest'], L['neck'], 'spine_02', True)
    fc = real((0.0, LM['neck'][1] - 0.03, LM['neck'][2] - 0.11))
    B('fx_chest', fc, fc + Vector((0, -0.08, 0)), 'chest', deform=False, kind='socket')
    B('neck', L['neck'], L['neck2'], 'chest', True)
    B('neck_02', L['neck2'], L['head'], 'neck', True, kind='qh')
    B('head', L['head'], L['head_top'], 'neck_02', True)
    up = (L['head_top'] - L['head']).normalized()
    B('fx_head', L['head_top'], L['head_top'] + up * 0.08, 'head', deform=False, kind='socket')
    for s, P in ((1, 'L'), (-1, 'R')):
        g = lambda k: mir(L[k], s)
        ci, sh, el, wr, kn, fe = (g(k) for k in ('clav_in', 'shoulder', 'elbow', 'wrist', 'knuckle', 'finger_end'))
        B(f'{P}_Clavicle', ci, sh, 'chest')
        B(f'{P}_UpperArm', sh, el, f'{P}_Clavicle', True)
        B(f'{P}_UpperArm_twist', sh, sh.lerp(el, 0.5), f'{P}_UpperArm')
        B(f'{P}_ForeArm', el, wr, f'{P}_UpperArm', True)
        B(f'{P}_ForeArm_twist', el.lerp(wr, 0.5), wr, f'{P}_ForeArm')
        B(f'{P}_Hand', wr, kn, f'{P}_ForeArm', True)
        B(f'{P}_Finger', kn, fe, f'{P}_Hand', True, kind='qh')
        pm = wr.lerp(kn, 0.5)
        B(f'fx_hand_{P}', pm, pm + Vector((0, 0, -0.07)), f'{P}_Hand', deform=False, kind='socket')
        hp, kq, an, ba, to = (g(k) for k in ('hip', 'knee', 'ankle', 'ball', 'toe'))
        B(f'{P}_Thigh', hp, kq, 'pelvis')
        B(f'{P}_Calf', kq, an, f'{P}_Thigh', True)
        B(f'{P}_Foot', an, ba, f'{P}_Calf', True)
        B(f'{P}_Toe', ba, to, f'{P}_Foot', True)
    for i, par in DOME_PARENT.items():
        B(f'dome_0{i}', L[f'dome{i}_c'], L[f'dome{i}_t'], par, kind='extra')
    for cn, c in CHAINS.items():
        sides = ((1, '', ''),) if not c['side'] else ((1, 'L_', 'L_'), (-1, 'R_', 'R_'))
        for s, pre, ppre in sides:
            pts = [mir(real(p), s) for p in c['pts']]
            par = c['parent'] if c['parent'] not in ('Clavicle',) else f'{ppre}{c["parent"]}'
            nm = f'{pre}{cn}'
            B(f'{nm}_01', pts[0], pts[1], par, kind='cloth')
            B(f'{nm}_02', pts[1], pts[2], f'{nm}_01', True, kind='cloth')
    return out


def build_armature(bpy, name, bones, display='OCTAHEDRAL'):
    arm = bpy.data.armatures.new(name); rig = bpy.data.objects.new(name, arm)
    bpy.context.scene.collection.objects.link(rig)
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = rig; rig.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm.edit_bones
    for b in bones:
        e = eb.new(b['name']); e.head = b['head']; e.tail = b['tail']; e.use_deform = b['deform']
        e.align_roll(roll_vector(b['head'], b['tail']))
    for b in bones:
        if b['parent']:
            e = eb[b['name']]; e.parent = eb[b['parent']]; e.use_connect = b['connect']
    bpy.ops.object.mode_set(mode='OBJECT')
    arm.display_type = display; rig.show_in_front = True
    return rig


def vertex_srgb(bpy, ob, size=1024):
    """Base colour (sRGB, 0..1) at each vertex: mean over its loops of the base-colour texel (image scaled to size)."""
    import numpy as np
    mat = ob.data.materials[0]
    def up(sock, depth=0):
        for l in sock.links:
            nd = l.from_node
            if nd.type == 'TEX_IMAGE' and nd.image:
                return nd.image
            if depth < 6:
                for s in nd.inputs:
                    im = up(s, depth + 1)
                    if im:
                        return im
        return None
    img = None
    for n in mat.node_tree.nodes:
        if n.type == 'BSDF_PRINCIPLED':
            img = up(n.inputs['Base Color'])
    small = img.copy(); small.scale(size, size)
    px = np.empty(size * size * 4, dtype=np.float32); small.pixels.foreach_get(px); px = px.reshape(size, size, 4)
    bpy.data.images.remove(small)
    me = ob.data; uv = me.uv_layers.active.data
    nl = len(me.loops)
    vi = np.empty(nl, dtype=np.int64); me.loops.foreach_get('vertex_index', vi)
    uvs = np.empty(nl * 2, dtype=np.float32); uv.foreach_get('uv', uvs); uvs = uvs.reshape(nl, 2)
    x = np.clip((uvs[:, 0] * size).astype(int), 0, size - 1); y = np.clip((uvs[:, 1] * size).astype(int), 0, size - 1)
    acc = np.zeros((len(me.vertices), 3)); cnt = np.zeros(len(me.vertices))
    np.add.at(acc, vi, px[y, x, :3]); np.add.at(cnt, vi, 1)
    return acc / np.maximum(cnt, 1)[:, None], img.name


def landmarks_real():
    return {k: [round(c, 5) for c in real(v)] for k, v in LM.items()}


def import_scaled(bpy, name='P04_hive_sleeper_Src'):
    """Fresh scene with the GLB as ONE mesh, transforms applied, importer welding (merge_vertices), scaled by S about
    the origin (Tripo pivot = bottom centre: x,y bbox centre is already 0, hands/knees/feet on z = 0)."""
    from mathutils import Matrix
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.import_scene.gltf(filepath=GLB, merge_vertices=True)
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    for o in meshes:
        M = o.matrix_world.copy(); o.parent = None; o.data.transform(M); o.matrix_world.identity()
    for o in [o for o in bpy.data.objects if o.type != 'MESH']:
        bpy.data.objects.remove(o)
    assert len(meshes) == 1
    ob = meshes[0]; ob.name = name; ob.data.name = name + '_mesh'
    ob.data.transform(Matrix.Scale(S, 4)); ob.data.update()
    return ob
