"""P03 R1 -> G1: measure the landmarks, build the proposed skeletons (A full, B swarm subset) as temporary armatures,
render the joints over the mesh (front / side / top + leg close-ups) and write the landmark JSON.

blender -b --factory-startup -P p03_g1_proposal.py -- <out_dir> [height_m]
Outputs in <out_dir>: landmarks_auto.json, bones_A.json, bones_B.json, g1_<variant>_<view>.png (+ _bones.png, _cam.json),
labels_<variant>_<view>.json (bone label pixel positions for the sheet).
"""
import bpy, sys, os, json, colorsys
import numpy as np
from mathutils import Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import p03_common as pc  # noqa: E402
import p03_skeleton as sk  # noqa: E402
rb = pc.rb

argv = sys.argv[sys.argv.index('--') + 1:]
OUT = argv[0]; H = float(argv[1]) if len(argv) > 1 else pc.HEIGHT_DEFAULT
os.makedirs(OUT, exist_ok=True)

M = pc.Moth(H)
LM = sk.landmarks(M)
A = sk.bones_A(LM); B = sk.bones_B(A)
with open(os.path.join(OUT, 'landmarks_auto.json'), 'w') as f:
    json.dump(sk.lm_json(LM), f, indent=1)


def bjson(bl):
    return [dict(name=b['name'], parent=b['parent'], head=[round(x, 4) for x in b['head']], tail=[round(x, 4) for x in b['tail']],
                 deform=b['deform'], group=b['group'], length=round((b['tail'] - b['head']).length, 4)) for b in bl]


json.dump(bjson(A), open(os.path.join(OUT, 'bones_A.json'), 'w'), indent=1)
json.dump(bjson(B), open(os.path.join(OUT, 'bones_B.json'), 'w'), indent=1)

GROUP_COL = {'core': (0.6, 0.6, 0.6), 'body': (1.0, 0.45, 0.1), 'head': (0.75, 0.3, 1.0), 'abdomen': (1.0, 0.75, 0.1),
             'antenna': (0.95, 0.35, 0.85), 'wingF': (0.15, 0.95, 0.35), 'wingB': (0.1, 0.8, 1.0),
             'leg1': (1.0, 0.2, 0.2), 'leg2': (1.0, 0.95, 0.2), 'leg3': (0.3, 0.5, 1.0), 'socket': (0.55, 0.55, 0.55)}
GROUP_OF = {b['name']: b['group'] for b in A}


def bone_color(name):
    g = GROUP_OF.get(name, 'core'); c = GROUP_COL[g]
    if name.endswith('_02'):
        c = tuple(min(1, 0.65 * x + 0.35) for x in c)
    elif name.endswith('_03'):
        c = tuple(0.6 * x for x in c)
    return c


rb.bone_color = bone_color                     # proxies coloured by bone group (rigbatch reads the module global)
ob = M.ob
rb.set_point_colors(ob, [tuple(0.55 + 0.45 * x for x in c) for c in M.role_colors()])

VIEWS = {'front': ('front', (0, 0, 0.29), 1.36), 'side': ('left', (0, 0.0, 0.27), 0.62), 'top': ('topdown', (0, 0.02, 0.3), 1.36),
         'legs_side': ('left', (0, 0.0, 0.13), 0.56), 'legs_front': ('front', (0.12, 0, 0.13), 0.4),
         'head_front': ('front', (0, -0.1, 0.42), 0.5)}


def project(cam, p, res):
    R = cam.matrix_world.to_3x3(); right = R @ Vector((1, 0, 0)); up = R @ Vector((0, 1, 0))
    d = Vector(p) - cam.location; s = cam.data.ortho_scale
    return 0.5 + d.dot(right) / s, 0.5 + d.dot(up) / s       # u, v (v up)


for var, bl in (('A', A), ('B', B)):
    rig = sk.build_armature(bl, name=f'_prop_{var}')
    proxy = rb.bone_proxy(rig, posed=False, scale=0.85)
    rig.hide_render = True
    for vname, (view, ctr, size) in VIEWS.items():
        if var == 'B' and vname.startswith(('legs', 'head')):
            continue
        cam = rb.setup_render(1100)
        c = Vector(ctr); lo = c - Vector((size,) * 3) / 2; hi = c + Vector((size,) * 3) / 2
        rb.place_camera(cam, lo, hi, view, center=c, size=size)
        rb.only_visible([ob]); rb.shading('VERTEX', xray=True, alpha=0.55)
        pre = os.path.join(OUT, f'g1_{var}_{vname}')
        rb.render_to(pre + '.png')
        rb.only_visible([proxy]); rb.shading('VERTEX', xray=False)
        rb.render_to(pre + '_bones.png')
        labels = []
        for b in bl:
            mid = (b['head'] + b['tail']) / 2
            u, v = project(cam, mid, 1100)
            if 0 < u < 1 and 0 < v < 1:
                labels.append(dict(name=b['name'], u=round(u, 4), v=round(v, 4), group=b['group'],
                                   hu=round(project(cam, b['head'], 1100)[0], 4), hv=round(project(cam, b['head'], 1100)[1], 4)))
        json.dump(labels, open(pre + '_labels.json', 'w'), indent=0)
    for o in bpy.context.scene.objects:
        o.hide_render = False
    bpy.data.objects.remove(proxy); bpy.data.objects.remove(rig)
print('G1_PROPOSAL_DONE', len(A), len(B))
