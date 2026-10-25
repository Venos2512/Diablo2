"""H2_FL_hand rig, R5 QA renders (blender -b, Workbench; tiles composed by h11b_compose.py).

Modes (all write PNG tiles + a tiles.json with the 2D projections of the bone heads, for labels):
  skeleton <tag>            rest pose, X-ray-like: mesh 35 % alpha + runtime bones as thin cylinders + joint spheres; views top / bottom / side / thumb
  weights <tag>             per-finger chain maps (each bone of the finger a colour, blended by weight), dominant-bone map, influence count
  rom <tag> [poses]         textured (base colour), 3 views per pose: dorsal 3/4, palm 3/4, ulnar side; poses from rig_recipe 'rom'
  stretch <tag> [poses]     per-vertex max edge ratio (blue 1.0 -> white 1.25 -> red 1.5+), dorsal 3/4 + palm 3/4
Output: rig/qa/_tiles/<mode>_<tag>/<pose>_<view>.png
Usage: blender -b --factory-startup -P h11_render.py -- <rig_dir> <mode> <tag> [pose,pose]
"""
import json
import math
import os
import sys

import bpy
import numpy as np
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Matrix, Quaternion, Vector

argv = sys.argv[sys.argv.index('--') + 1:]
rig, mode, tag = argv[0], argv[1], argv[2]
only = argv[3].split(',') if len(argv) > 3 else None
bpy.ops.wm.open_mainfile(filepath=os.path.join(rig, '_work', f'h08_{tag}.blend'))
R = json.load(open(os.path.join(rig, 'rig_recipe.json')))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
mesh = bpy.data.objects['H2_FL_hand']
rt = bpy.data.objects['H2_FL_hand_rig']
ctl = bpy.data.objects['H2_FL_hand_ctl']
out_dir = os.path.join(rig, 'qa', '_tiles', f'{mode}_{tag}')
os.makedirs(out_dir, exist_ok=True)
sc = bpy.context.scene
sc.render.engine = 'BLENDER_WORKBENCH'
sc.render.resolution_x = sc.render.resolution_y = 640
sc.render.film_transparent = False
sh = sc.display.shading
sh.light = 'STUDIO'
sh.show_specular_highlight = True
sh.show_cavity = False
sc.display.render_aa = '8'
sc.view_settings.view_transform = 'Standard'
sh.background_type = 'VIEWPORT' if hasattr(sh, 'background_type') else sh.background_type
try:
    sh.background_type = 'VIEWPORT'
    sh.background_color = (0.22, 0.22, 0.23)
except Exception:
    pass
cam_d = bpy.data.cameras.new('qa_cam')
cam_d.lens = 60
cam = bpy.data.objects.new('qa_cam', cam_d)
sc.collection.objects.link(cam)
sc.camera = cam
C = Vector((0.06, -0.345, -0.03))
VIEWS = {
    'dorsal34': (Vector((0.12, -0.30, 0.42)), Vector((0, 0, 1))),
    'palm34': (Vector((0.10, -0.32, -0.42)), Vector((0, 0, 1))),
    'ulnar': (Vector((-0.45, -0.10, 0.05)), Vector((0, 0, 1))),
    'top': (Vector((0, 0, 0.55)), Vector((0, 1, 0))),
    'bottom': (Vector((0, 0, -0.55)), Vector((0, 1, 0))),
    'radial': (Vector((0.55, -0.02, 0.02)), Vector((0, 0, 1))),
    'tips': (Vector((0.05, -0.5, 0.1)), Vector((0, 0, 1))),
}


def aim(view, centre=C, dist_scale=1.0):
    off, up = VIEWS[view]
    cam.location = centre + off * dist_scale
    z = (cam.location - centre).normalized()
    x = up.cross(z).normalized()
    y = z.cross(x)
    cam.matrix_world = Matrix((list(x) + [0], list(y) + [0], list(z) + [0], [0, 0, 0, 1])).transposed()
    cam.location = centre + off * dist_scale


def render(path):
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)


def proj(points):
    return [list(world_to_camera_view(sc, cam, Vector(p)))[:2] for p in points]


DEG = math.pi / 180
FING = ['thumb', 'index', 'middle', 'ring', 'pinky']


def reset():
    for pb in ctl.pose.bones:
        pb.rotation_mode = 'QUATERNION'
        pb.rotation_quaternion = (1, 0, 0, 0)
        pb.location = (0, 0, 0)
    bpy.context.view_layer.update()


import h_pose_bl  # noqa: E402
h_pose_bl.bind(ctl, R)
apply_pose = h_pose_bl.apply



def textured():
    sh.color_type = 'TEXTURE'
    mesh.hide_render = False


def set_attr_colors(name, cols):
    me = mesh.data
    if name in me.color_attributes:
        me.color_attributes.remove(me.color_attributes[name])
    ca = me.color_attributes.new(name, 'FLOAT_COLOR', 'POINT')
    c = np.ones((len(me.vertices), 4), np.float32)
    c[:, :3] = cols
    ca.data.foreach_set('color', c.ravel())
    me.color_attributes.active_color = ca
    sh.color_type = 'VERTEX'


tiles = {}
if mode == 'rom' or mode == 'stretch':
    poses = [n for n in R['rom']['poses'] if only is None or n in only]
    rt.hide_render = ctl.hide_render = True
    V0 = np.array([v.co[:] for v in mesh.data.vertices])
    E = np.array([e.vertices[:] for e in mesh.data.edges])
    el0 = np.linalg.norm(V0[E[:, 0]] - V0[E[:, 1]], axis=1)
    for pn in poses:
        apply_pose(R['rom']['poses'][pn])
        if mode == 'stretch':
            dg = bpy.context.evaluated_depsgraph_get()
            ev = mesh.evaluated_get(dg)
            me = ev.to_mesh()
            Vp = np.array([v.co[:] for v in me.vertices])
            ev.to_mesh_clear()
            r = np.linalg.norm(Vp[E[:, 0]] - Vp[E[:, 1]], axis=1) / np.maximum(el0, 1e-9)
            vm = np.ones(len(V0))
            np.maximum.at(vm, E[:, 0], r)
            np.maximum.at(vm, E[:, 1], r)
            vmin = np.ones(len(V0))
            np.minimum.at(vmin, E[:, 0], r)
            np.minimum.at(vmin, E[:, 1], r)
            t = np.clip((vm - 1.0) / 0.5, 0, 1)
            col = np.stack([0.2 + 0.8 * np.clip(t * 2, 0, 1), 0.2 + 0.8 * np.clip(2 - 2 * t, 0, 1) * np.clip(t * 2, 0, 1) + 0.6 * (t < 0.02),
                            0.85 * (1 - np.clip(t * 2, 0, 1))], 1)
            comp = np.clip((1 - vmin) / 0.4, 0, 1)  # compression shown as darkening
            col *= (1 - 0.6 * comp)[:, None]
            set_attr_colors('stretch', col)
            views = ['dorsal34', 'palm34']
        else:
            textured()
            views = ['dorsal34', 'palm34', 'ulnar']
        dg = bpy.context.evaluated_depsgraph_get()
        ev = mesh.evaluated_get(dg)
        me = ev.to_mesh()
        Vp = np.array([v.co[:] for v in me.vertices])
        ev.to_mesh_clear()
        hv = Vp[-V0[:, 1] > 0.25]  # frame the hand (rest s > 0.25), wherever the pose put it
        ctr = Vector(((hv.min(0) + hv.max(0)) / 2).tolist())
        for v in views:
            aim(v, centre=ctr, dist_scale=0.62)
            render(os.path.join(out_dir, f'{pn}_{v}.png'))
            tiles[f'{pn}_{v}'] = dict(pose=pn, view=v)
    reset()
elif mode == 'skeleton':
    reset()
    # bones as cylinders + spheres (Workbench has no bone draw in renders)
    mat_b = bpy.data.materials.new('qa_bone')
    mat_b.diffuse_color = (1.0, 0.55, 0.05, 1)
    mat_j = bpy.data.materials.new('qa_joint')
    mat_j.diffuse_color = (0.1, 0.9, 1.0, 1)
    mat_s = bpy.data.materials.new('qa_socket')
    mat_s.diffuse_color = (1.0, 0.1, 0.8, 1)
    objs = []
    for b in rt.data.bones:
        h, t = b.head_local, b.tail_local
        L = (t - h).length
        bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.0012 if b.use_deform else 0.0008, depth=L, location=(h + t) / 2)
        cy = bpy.context.active_object
        cy.rotation_mode = 'QUATERNION'
        cy.rotation_quaternion = Vector((0, 0, 1)).rotation_difference((t - h).normalized())
        cy.data.materials.append(mat_b if b.use_deform else mat_s)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=0.0026 if b.use_deform else 0.002, location=h)
        sp = bpy.context.active_object
        sp.data.materials.append(mat_j if b.use_deform else mat_s)
        objs += [cy, sp]
    sh.color_type = 'MATERIAL'
    mat_m = bpy.data.materials.new('qa_mesh')
    mat_m.diffuse_color = (0.75, 0.72, 0.7, 0.28)
    mesh.data.materials.clear()
    mesh.data.materials.append(mat_m)
    sh.show_xray = False
    sc.display.shading.show_backface_culling = False
    try:
        mat_m.blend_method = 'BLEND'
    except Exception:
        pass
    sh.color_type = 'MATERIAL'
    sh.show_xray = True
    sh.xray_alpha = 0.55
    heads = {b.name: list(b.head_local) for b in rt.data.bones}
    for v, dsc in (('top', 1.0), ('bottom', 1.0), ('radial', 1.0), ('ulnar', 1.0), ('tips', 0.7)):
        aim(v, dist_scale=dsc)
        render(os.path.join(out_dir, f'rest_{v}.png'))
        tiles[f'rest_{v}'] = dict(view=v, heads={n: proj([p])[0] for n, p in heads.items()})
elif mode == 'weights':
    reset()
    rt.hide_render = ctl.hide_render = True
    n = len(mesh.data.vertices)
    gi = {vg.index: vg.name for vg in mesh.vertex_groups}
    W = {}
    for v in mesh.data.vertices:
        for g in v.groups:
            W.setdefault(gi[g.group], np.zeros(n))[v.index] = g.weight
    pal = {'_01': (1.0, 0.25, 0.15), '_02': (0.2, 0.85, 0.25), '_03': (0.2, 0.45, 1.0)}
    base = np.array([0.35, 0.35, 0.37])
    for f in FING:
        col = np.tile(base, (n, 1))
        tot = np.zeros(n)
        acc = np.zeros((n, 3))
        for suf, c in pal.items():
            w = W.get(f + suf, np.zeros(n))
            acc += w[:, None] * np.array(c)
            tot += w
        col = acc + (1 - tot)[:, None] * base
        set_attr_colors(f'w_{f}', col)
        for v in ('top', 'bottom', 'radial' if f in ('thumb', 'index') else 'ulnar'):
            aim(v)
            render(os.path.join(out_dir, f'{f}_{v}.png'))
            tiles[f'{f}_{v}'] = dict(finger=f, view=v)
    # dominant bone + influence count
    names = sorted(W)
    M = np.stack([W[k] for k in names], 1)
    dom = np.argmax(M, 1)
    rng = np.random.default_rng(7)
    cols = rng.uniform(0.15, 1.0, (len(names), 3))
    blend = (M[:, :, None] * cols[None]).sum(1)
    set_attr_colors('w_dom', blend)
    for v in ('top', 'bottom', 'radial', 'ulnar'):
        aim(v, centre=Vector((0.03, -0.24, -0.02)), dist_scale=1.5)
        render(os.path.join(out_dir, f'dominant_{v}.png'))
        tiles[f'dominant_{v}'] = dict(view=v, legend={nm: [round(x, 3) for x in cols[i]] for i, nm in enumerate(names)})
    cnt = (M > 0).sum(1)
    cc = np.array([[0.3, 0.3, 0.35], [0.2, 0.5, 1.0], [0.2, 0.9, 0.3], [1.0, 0.85, 0.1], [1.0, 0.2, 0.15]])[np.clip(cnt, 0, 4)]
    set_attr_colors('w_count', cc)
    for v in ('top', 'bottom'):
        aim(v, centre=Vector((0.03, -0.24, -0.02)), dist_scale=1.5)
        render(os.path.join(out_dir, f'count_{v}.png'))
        tiles[f'count_{v}'] = dict(view=v)
json.dump(tiles, open(os.path.join(out_dir, 'tiles.json'), 'w'), indent=1)
print('H11 ' + json.dumps(dict(mode=mode, tag=tag, tiles=len(tiles), dir=out_dir)))
