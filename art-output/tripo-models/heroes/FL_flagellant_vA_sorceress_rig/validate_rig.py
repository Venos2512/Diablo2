"""Validation of the exported rigged GLB (+ QA clip GLB).  Run inside Blender (background):

  blender -b --factory-startup -P validate_rig.py -- --out <rig_dir> [--src <sorceress.glb>] [--tgt <flagellant.glb>]

Part A reads the GLB JSON/binary directly (no Blender): skeleton names/hierarchy/local axes vs the Sorceress, skin accessors
(joint ids, weight sums, influences), inverse bind matrices vs the node hierarchy, bounds, textures byte-identical to the input.
Part B re-imports the GLB in Blender: rest mesh vs the original Tripo mesh (scaled), and motion equivalence between the authored
.blend clips and the clips re-imported from the exported GLB.
Writes <out>/validation.json and merges it with build_report.json into <out>/mapping_and_validation.json.
"""
import bpy, sys, os, json, struct, hashlib, math
import numpy as np
from mathutils import Matrix, Vector, Quaternion
from mathutils.kdtree import KDTree

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import rig_fit
from posing import apply_pose, mesh_positions

BASE = 'FL_flagellant_vA_sorceress_rig'
ATT = 'C:/Users/HLC_2021/.t3/userdata/attachments/'
DEF_SRC = ATT + 'e6e4f735-8929-46de-80d2-ccf7c75885f3-8ac7bb44-5270-469b-afc9-ea55978e8516-glb.glb'
DEF_TGT = ATT + 'e6e4f735-8929-46de-80d2-ccf7c75885f3-df4f46f7-90e0-4e21-9ace-e84092e9353f-glb.glb'
CT = {5120: ('b', 1), 5121: ('B', 1), 5122: ('h', 2), 5123: ('H', 2), 5125: ('I', 4), 5126: ('f', 4)}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}
NP = {5120: '<i1', 5121: '<u1', 5122: '<i2', 5123: '<u2', 5125: '<u4', 5126: '<f4'}


class Glb:
    def __init__(self, path):
        d = open(path, 'rb').read()
        l = struct.unpack('<I', d[12:16])[0]
        self.j = json.loads(d[20:20 + l])
        self.d = d
        self.off = 20 + l + 8
        self.size = len(d)

    def acc(self, i):
        a = self.j['accessors'][i]
        bv = self.j['bufferViews'][a['bufferView']]
        n = NC[a['type']]
        arr = np.frombuffer(self.d, dtype=NP[a['componentType']], count=a['count'] * n,
                            offset=self.off + bv.get('byteOffset', 0) + a.get('byteOffset', 0))
        if 'byteStride' in bv and bv['byteStride'] != np.dtype(NP[a['componentType']]).itemsize * n:
            raise RuntimeError('interleaved accessor not supported by this validator')
        arr = arr.reshape(a['count'], n).astype(np.float64)
        if a.get('normalized'):
            arr = arr / {5121: 255.0, 5123: 65535.0, 5120: 127.0, 5122: 32767.0}[a['componentType']]
        return arr

    def image_bytes(self, k):
        bv = self.j['bufferViews'][self.j['images'][k]['bufferView']]
        return self.d[self.off + bv.get('byteOffset', 0): self.off + bv.get('byteOffset', 0) + bv['byteLength']]

    def node_tree(self):
        nodes = self.j['nodes']
        parent = {}
        for i, n in enumerate(nodes):
            for c in n.get('children', []):
                parent[c] = i
        return nodes, parent

    def local(self, n):
        t = Vector(n.get('translation', (0, 0, 0)))
        r = n.get('rotation', (0, 0, 0, 1))
        q = Quaternion((r[3], r[0], r[1], r[2]))
        s = Vector(n.get('scale', (1, 1, 1)))
        return t, q, s


def mat_trs(t, q, s):
    return Matrix.LocRotScale(t, q, s)


def part_a(src, tgt, out_glb):
    res = {}
    S, T, G = Glb(src), Glb(tgt), Glb(out_glb)
    res['glb_bytes'] = {'sorceress': S.size, 'flagellant_input': T.size, 'rigged_output': G.size}
    # ---- skeleton identity ----
    sk_s, sk_g = S.j['skins'][0], G.j['skins'][0]
    names_s = [S.j['nodes'][i]['name'] for i in sk_s['joints']]
    names_g = [G.j['nodes'][i]['name'] for i in sk_g['joints']]
    res['skins_in_output'] = len(G.j['skins'])
    res['joint_count'] = {'sorceress': len(names_s), 'output': len(names_g)}
    res['joint_names_identical_set'] = set(names_s) == set(names_g)
    res['joint_names_identical_order'] = names_s == names_g
    ns, ps = S.node_tree()
    ng, pg = G.node_tree()
    idx_s = {n['name']: i for i, n in enumerate(ns)}
    idx_g = {n['name']: i for i, n in enumerate(ng)}
    par_s = {n['name']: (ns[ps[i]]['name'] if i in ps else None) for i, n in enumerate(ns) if n['name'] in set(names_s)}
    par_g = {n['name']: (ng[pg[i]]['name'] if i in pg else None) for i, n in enumerate(ng) if n['name'] in set(names_g)}
    # armature wrapper node is the parent of 'root' in the export; ignore it
    par_g['root'] = None
    par_s['root'] = None
    bad = [k for k in names_s if par_s.get(k) != par_g.get(k)]
    res['hierarchy_mismatches'] = bad
    # local rotation equality (the Sorceress node rotations are the retarget contract)
    worst, worst_name, tr_ratio = 0.0, None, []
    for k in names_s:
        if k == 'root':
            continue
        qs = S.local(ns[idx_s[k]])[1]
        qg = G.local(ng[idx_g[k]])[1]
        ang = 2 * math.acos(min(1.0, abs(qs.dot(qg))))
        if ang > worst:
            worst, worst_name = ang, k
        ts, tg = S.local(ns[idx_s[k]])[0], G.local(ng[idx_g[k]])[0]
        if ts.length > 1e-3:
            tr_ratio.append(tg.length / ts.length)
    res['local_rotation_max_dev_deg'] = round(math.degrees(worst), 5)
    res['local_rotation_max_dev_bone'] = worst_name
    res['local_translation_length_ratio_output_over_sorceress'] = {'median': float(np.median(tr_ratio)), 'min': float(np.min(tr_ratio)),
                                                                   'max': float(np.max(tr_ratio)), 'n': len(tr_ratio)}
    # ---- inverse bind matrices consistent with the node hierarchy ----
    ibm = G.acc(sk_g['inverseBindMatrices']).reshape(-1, 4, 4)
    worldcache = {}

    def world(i):
        if i in worldcache:
            return worldcache[i]
        t, q, s = G.local(ng[i])
        m = mat_trs(t, q, s)
        if i in pg:
            m = world(pg[i]) @ m
        worldcache[i] = m
        return m
    dev = 0.0
    for j, ni in enumerate(sk_g['joints']):
        M = Matrix(ibm[j].reshape(4, 4).T.tolist())            # glTF column-major -> Blender row-major
        dev = max(dev, max(abs(v) for row in (world(ni) @ M - Matrix.Identity(4)) for v in row))
    res['inverse_bind_vs_hierarchy_max_abs_dev'] = dev
    # ---- skin accessors ----
    mesh = [m for m in G.j['meshes']][0]
    prim = mesh['primitives'][0]
    at = prim['attributes']
    J, W = G.acc(at['JOINTS_0']).astype(int), G.acc(at['WEIGHTS_0'])
    sums = W.sum(axis=1)
    res['skin_vertices'] = int(len(J))
    res['weights_sum_min'] = float(sums.min())
    res['weights_sum_max'] = float(sums.max())
    res['vertices_with_zero_weight'] = int((sums < 1e-6).sum())
    res['max_nonzero_influences'] = int((W > 1e-6).sum(axis=1).max())
    nzj = J[W > 1e-6]
    res['joint_ids_in_range'] = bool(nzj.min() >= 0 and nzj.max() < len(names_g))
    used = np.unique(nzj)
    res['joints_with_weights'] = int(len(used))
    res['joints_without_weights'] = sorted(set(names_g) - {names_g[i] for i in used})
    P = G.acc(at['POSITION'])
    idx = G.acc(prim['indices']).astype(np.int64).ravel() if False else None
    a = G.j['accessors'][prim['indices']]
    res['triangles'] = int(a['count'] // 3)
    res['vertices'] = int(len(P))
    mn, mx = P.min(axis=0), P.max(axis=0)
    res['bounds_gltf_yup_m'] = {'min': [round(float(v), 4) for v in mn], 'max': [round(float(v), 4) for v in mx]}
    res['height_m'] = round(float(mx[1] - mn[1]), 4)
    res['feet_on_ground_y_min_m'] = round(float(mn[1]), 5)
    # triangles of the original
    pt = T.j['meshes'][0]['primitives'][0]
    res['triangles_input'] = int(T.j['accessors'][pt['indices']]['count'] // 3)
    # ---- textures byte-identical ----
    imgs_t = {im['name'].rsplit('.', 1)[0]: hashlib.sha256(T.image_bytes(k)).hexdigest() for k, im in enumerate(T.j['images'])}
    imgs_g = {im['name'].rsplit('.', 1)[0]: hashlib.sha256(G.image_bytes(k)).hexdigest() for k, im in enumerate(G.j['images'])}
    res['textures_byte_identical_to_input'] = imgs_t == imgs_g
    res['textures'] = {k: v[:12] for k, v in imgs_g.items()}
    res['material_count'] = len(G.j['materials'])
    res['animations_in_main_glb'] = len(G.j.get('animations', []))
    return res, G


def vertex_weights(obj):
    names = {vg.index: vg.name for vg in obj.vertex_groups}
    return [{names[g.group]: g.weight for g in v.groups if g.weight > 1e-6} for v in obj.data.vertices]


def l1(a, b):
    return sum(abs(a.get(k, 0.0) - b.get(k, 0.0)) for k in set(a) | set(b))


def match_twins(kd, w0, rest1, w1):
    """exported vertex -> authored vertex: among coincident candidates (several shells share seam positions) pick the closest weight vector."""
    twin, dev = [], []
    for p, w in zip(rest1, w1):
        cands = [i for (_, i, _) in kd.find_range(Vector(p), 1e-4)]
        best = min(cands, key=lambda i: l1(w0[i], w))
        twin.append(best)
        dev.append(l1(w0[best], w))
    return np.array(twin), np.array(dev)


def part_b(tgt, out_glb, qa_glb, blend):
    res = {}
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=out_glb)
    arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
    mesh = [o for o in bpy.data.objects if o.type == 'MESH' and any(m.type == 'ARMATURE' for m in o.modifiers)][0]
    apply_pose(arm, [])
    # the importer keeps node pose (root scale 1.0 here), so the rest pose is the bind pose
    P = mesh_positions(mesh)
    w_main = vertex_weights(mesh)
    res['reimported_rest_bounds_m'] = {'min': [round(float(v), 4) for v in P.min(0)], 'max': [round(float(v), 4) for v in P.max(0)]}
    # compare with the original mesh scaled/centred exactly like the build
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=tgt)
    ref = [o for o in bpy.data.objects if o.type == 'MESH'][0]
    me = ref.data
    n = len(me.vertices)
    a = np.empty(n * 3)
    me.vertices.foreach_get('co', a)
    a = a.reshape(-1, 3) @ np.array(ref.matrix_world.to_3x3()).T + np.array(ref.matrix_world.translation)
    a = a * rig_fit.S - np.array([rig_fit.CX * rig_fit.S, rig_fit.CY * rig_fit.S, 0.0])
    kd = KDTree(n)
    for i in range(n):
        kd.insert(Vector(a[i]), i)
    kd.balance()
    dmax = max(kd.find(Vector(p))[2] for p in P)
    res['rest_mesh_max_dist_to_scaled_input_vertex_m'] = float(dmax)
    res['rest_mesh_vertices'] = {'reimported': int(len(P)), 'input': int(n)}
    # ---- motion equivalence: authored (.blend) vs re-imported (qa clips GLB) ----
    samples = {'QA_idle': [0, 12, 24, 36], 'QA_walk': [0, 8, 16, 24], 'QA_arm_swing': [0, 10, 18, 28]}
    bpy.ops.wm.open_mainfile(filepath=blend)
    arm0 = bpy.data.objects['FL_flagellant_vA_rig']
    mesh0 = bpy.data.objects['FL_flagellant_vA_body']
    ref_pos = {}
    apply_pose(arm0, [])
    ref_rest = mesh_positions(mesh0)
    w0 = vertex_weights(mesh0)
    kd0 = KDTree(len(ref_rest))
    for i, p in enumerate(ref_rest):
        kd0.insert(Vector(p), i)
    kd0.balance()
    _, wdev_main = match_twins(kd0, w0, P, w_main)
    res['main_glb_vertex_weights_vs_authored'] = {'max_L1_diff': float(wdev_main.max()), 'mean_L1_diff': float(wdev_main.mean())}
    for cname, frames in samples.items():
        act = bpy.data.actions[cname]
        arm0.animation_data.action = None
        apply_pose(arm0, [])                       # clear pose values left behind by the previous clip
        arm0.animation_data.action = act
        for f in frames:
            bpy.context.scene.frame_set(f + 1)
            ref_pos[(cname, f)] = mesh_positions(mesh0)
        arm0.animation_data.action = None
    # authored clip == intended pose spec (guards against baking errors, independent of the glTF round trip)
    import clips
    auth = {}
    for cname, frames in samples.items():
        fn, nfr = clips.CLIPS[cname]
        worst = 0.0
        for f in frames:
            arm0.animation_data.action = None
            apply_pose(arm0, fn(f, nfr))
            want = mesh_positions(mesh0)
            apply_pose(arm0, [])
            arm0.animation_data.action = bpy.data.actions[cname]
            bpy.context.scene.frame_set(f + 2)
            bpy.context.scene.frame_set(f + 1)
            worst = max(worst, float(np.abs(mesh_positions(mesh0) - want).max()))
        arm0.animation_data.action = None
        auth[cname] = worst
    res['clip_authored_vs_pose_spec_max_vertex_dev_m'] = auth
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=qa_glb)
    arm1 = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
    mesh1 = [o for o in bpy.data.objects if o.type == 'MESH' and any(m.type == 'ARMATURE' for m in o.modifiers)][0]
    if arm1.animation_data:
        for t in list(arm1.animation_data.nla_tracks):
            arm1.animation_data.nla_tracks.remove(t)
        arm1.animation_data.action = None          # the importer leaves one clip active: evaluate the true rest first
    res['clips_in_qa_glb'] = sorted(act.name for act in bpy.data.actions)
    apply_pose(arm1, [])
    rest1 = mesh_positions(mesh1)
    # the exporter splits vertices on UV/normal seams (6755 -> 6757): map each exported vertex to its rest-pose twin
    twin, wdev = match_twins(kd0, w0, rest1, vertex_weights(mesh1))
    res['qa_glb_vertex_weights_vs_authored'] = {'max_L1_diff': float(wdev.max()), 'mean_L1_diff': float(wdev.mean())}
    dev = {}
    for cname, frames in samples.items():
        cands = [x for x in bpy.data.actions if x.name == cname or x.name.startswith(cname)]
        if not cands:
            dev[cname] = None
            continue
        arm1.animation_data_create()
        arm1.animation_data.action = None
        apply_pose(arm1, [])
        arm1.animation_data.action = cands[0]
        worst = 0.0
        for f in frames:
            bpy.context.scene.frame_set(f + 1)
            Q = mesh_positions(mesh1)
            worst = max(worst, float(np.abs(Q - ref_pos[(cname, f)][twin]).max()))
        dev[cname] = worst
    res['clip_motion_max_vertex_dev_m'] = dev
    return res


def main():
    a = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    o = {'out': HERE, 'src': DEF_SRC, 'tgt': DEF_TGT}
    for i in range(0, len(a), 2):
        o[a[i].lstrip('-')] = a[i + 1]
    out = o['out']
    glb = os.path.join(out, BASE + '.glb')
    qa_glb = os.path.join(out, 'qa', BASE + '_qa_clips_geometry_only.glb')
    blend = os.path.join(out, BASE + '.blend')
    resA, G = part_a(o['src'], o['tgt'], glb)
    resB = part_b(o['tgt'], glb, qa_glb, blend)
    val = {'A_glb_file_checks': resA, 'B_blender_reimport_checks': resB}
    json.dump(val, open(os.path.join(out, 'validation.json'), 'w'), indent=1)
    rep = json.load(open(os.path.join(out, 'build_report.json')))
    json.dump({'inputs': {'sorceress_glb': o['src'], 'flagellant_glb': o['tgt']}, 'build': rep, 'validation': val},
              open(os.path.join(out, 'mapping_and_validation.json'), 'w'), indent=1)
    print('VALIDATION', json.dumps(val, indent=1)[:6000])


main()
