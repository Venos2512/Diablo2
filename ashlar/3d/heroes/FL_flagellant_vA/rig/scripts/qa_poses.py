"""QA: pose the rig with world-axis joint rotations, render textured Workbench views, measure mesh distortion.

blender -b --factory-startup -P qa_poses.py -- <file.blend|file.glb> <out_dir> [pose ...]

World axes: +X = character left, -Y = forward, +Z up.  Rotation of a bone is about its own head, in world axes, so the same
spec works on any skeleton whose rest pose is the D2R T-pose, whatever the local bone axes are.
Writes <out_dir>/pose_<name>_<view>.png and <out_dir>/pose_metrics.json (edge-stretch statistics per pose).
"""
import bpy, sys, os, math, json
import numpy as np
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from posing import X, Y, Z, apply_pose, mesh_positions

POSES = {
    'rest': [],
    'arms_down': [('L_UpperArm', Y, 65), ('R_UpperArm', Y, -65)],
    'arms_up': [('L_UpperArm', Y, -55), ('R_UpperArm', Y, 55)],
    'elbows_bent': [('L_ForeArm', Z, -85), ('R_ForeArm', Z, 85)],
    'fingers_curl': [(s + f, Y, 55 if s == 'L_' else -55) for s in ('L_', 'R_') for f in
                     ('finger_A_A', 'finger_B_A', 'finger_C_A', 'finger_D_A', 'finger_A_B', 'finger_B_B', 'finger_C_B', 'finger_D_B')],
    'stride': [('L_Thigh', X, -32), ('R_Thigh', X, 22), ('R_Calf', X, 38), ('L_Foot', X, 10)],
    'crouch_mid': [('cog', 'T', (0, 0.06, -0.16)), ('L_Thigh', X, -38), ('R_Thigh', X, -38), ('L_Calf', X, 62), ('R_Calf', X, 62),
                   ('L_Foot', X, -24), ('R_Foot', X, -24), ('spine_01', X, 8)],
    'crouch': [('cog', 'T', (0, 0.10, -0.30)), ('L_Thigh', X, -60), ('R_Thigh', X, -60), ('L_Calf', X, 95), ('R_Calf', X, 95),
               ('L_Foot', X, -35), ('R_Foot', X, -35), ('spine_01', X, 12), ('spine_02', X, 8)],
    'twist_bend': [('spine_01', X, 18), ('spine_02', Z, 16), ('chest', Z, 18), ('neck', Z, 12), ('head', Z, 22)],
    'head_turn_nod': [('neck', Z, 25), ('head', X, -18)],
    'skirt_swing': [('front_skirt_front_skirt_01', X, -25), ('front_skirt_front_skirt_03', X, -20)],
}
VIEWS = {'front': ((0, -9, 0.95), (math.radians(90), 0, 0)),
         'side': ((9, 0, 0.95), (math.radians(90), 0, math.radians(90))),
         'q34': ((6.4, -6.4, 1.6), None),
         'legs34': ((6.4, -6.4, 1.0), None, 1.5, (0, 0, 0.55)),
         'upperfront': ((0, -9, 1.5), (math.radians(90), 0, 0), 1.7, None),
         'upper34': ((6.4, -6.4, 1.9), None, 1.5, (0, 0, 1.45)),
         'handL': ((0.80, -9, 1.45), (math.radians(90), 0, 0), 0.7, None),
         'legsfront': ((0, -9, 0.6), (math.radians(90), 0, 0), 1.5, None)}


def aim(cam, target):
    d = Vector(target) - cam.location
    cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()


VIEWSET = os.environ.get('QA_VIEWS', 'front,side,q34').split(',')


def main():
    a = sys.argv[sys.argv.index('--') + 1:]
    path, out = a[0], a[1]
    want = a[2:] or list(POSES)
    os.makedirs(out, exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    if path.endswith('.blend'):
        bpy.ops.wm.open_mainfile(filepath=path)
    else:
        bpy.ops.import_scene.gltf(filepath=path)
    sc = bpy.context.scene
    arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
    mesh = [o for o in bpy.data.objects if o.type == 'MESH' and any(m.type == 'ARMATURE' for m in o.modifiers)][0]
    for o in bpy.data.objects:
        if o.name.startswith('Icosphere'):
            bpy.data.objects.remove(o)
    sc.render.engine = 'BLENDER_WORKBENCH'
    sh = sc.display.shading
    sh.light = 'STUDIO'; sh.color_type = 'TEXTURE'; sh.show_shadows = False
    sc.render.resolution_x = 900; sc.render.resolution_y = 1100
    sc.view_settings.view_transform = 'Standard'
    sc.world = bpy.data.worlds.new('w'); sc.world.color = (0.35, 0.35, 0.38)
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = 2.6
    # rest metrics
    apply_pose(arm, [])
    rest = mesh_positions(mesh)
    me = mesh.data
    e = np.empty(len(me.edges) * 2, dtype=np.int64)
    me.edges.foreach_get('vertices', e)
    e = e.reshape(-1, 2)
    rl = np.linalg.norm(rest[e[:, 0]] - rest[e[:, 1]], axis=1)
    ok = rl > 1e-5
    metrics = {}
    for pname in want:
        apply_pose(arm, POSES[pname])
        P = mesh_positions(mesh)
        pl = np.linalg.norm(P[e[:, 0]] - P[e[:, 1]], axis=1)
        ratio = pl[ok] / rl[ok]
        metrics[pname] = {'edge_ratio_p01': float(np.percentile(ratio, 1)), 'edge_ratio_p99': float(np.percentile(ratio, 99)),
                          'edge_ratio_min': float(ratio.min()), 'edge_ratio_max': float(ratio.max()),
                          'edges_stretched_gt_1.5x': int((ratio > 1.5).sum()), 'edges_squashed_lt_0.5x': int((ratio < 0.5).sum()),
                          'max_vertex_disp_m': float(np.abs(P - rest).max()),
                          'nan': bool(np.isnan(P).any())}
        for v, spec in VIEWS.items():
            if v not in VIEWSET:
                continue
            loc, rot = spec[0], spec[1]
            cam.data.ortho_scale = spec[2] if len(spec) > 2 else 2.6
            cam.location = loc
            if rot:
                cam.rotation_euler = rot
            else:
                aim(cam, spec[3] if len(spec) > 3 and spec[3] else (0, 0, 0.95))
            sc.render.filepath = os.path.join(out, 'pose_%s_%s.png' % (pname, v)).replace(chr(92), '/')
            bpy.ops.render.render(write_still=True)
    json.dump(metrics, open(os.path.join(out, 'pose_metrics.json'), 'w'), indent=1)
    print('POSE_METRICS', json.dumps({k: (round(v['edge_ratio_p01'], 2), round(v['edge_ratio_p99'], 2), v['edges_stretched_gt_1.5x']) for k, v in metrics.items()}))


main()
