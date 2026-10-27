"""P03 Hush-Moths R5: QA renders (QA_CHECKLIST A2) -> rig/qa/raw/*.png (+ _cam.json, labels json).

blender -b --factory-startup -P p03_r5_render.py
Opens rig/P03_hush_moths_rig.blend, never saves it. Textures are scaled to 1024 in memory (light renders, 8 threads at once).
"""
import bpy, sys, os, json, colorsys
import numpy as np
from mathutils import Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import p03_common as pc  # noqa: E402
import p03_skeleton as sk  # noqa: E402
import p03_skin as skin  # noqa: E402
import p03_qa as qa  # noqa: E402
rb = pc.rb

RIG = pc.ADIR + '/rig'; RAW = RIG + '/qa/raw'
os.makedirs(RAW, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=RIG + '/P03_hush_moths_rig.blend')
ob = bpy.data.objects['P03_hush_moths']; rig = bpy.data.objects['P03_hush_moths_rig']; ctl = bpy.data.objects['P03_hush_moths_ctl']
me = ob.data; N = len(me.vertices)
for im in bpy.data.images:
    if im.size[0] > 1024:
        im.scale(1024, 1024)
for o in (rig, ctl):
    o.hide_render = True
P0 = np.array([v.co[:] for v in me.vertices])

GROUP_COL = {'core': (0.6, 0.6, 0.6), 'body': (1.0, 0.45, 0.1), 'head': (0.75, 0.3, 1.0), 'abdomen': (1.0, 0.75, 0.1),
             'antenna': (0.95, 0.35, 0.85), 'wingF': (0.15, 0.95, 0.35), 'wingB': (0.1, 0.8, 1.0), 'wing_master': (0.1, 0.5, 0.2),
             'leg1': (1.0, 0.2, 0.2), 'leg2': (1.0, 0.95, 0.2), 'leg3': (0.3, 0.5, 1.0), 'leg_ik': (0.95, 0.5, 0.9), 'socket': (0.55, 0.55, 0.55)}
GROUP_OF = {}
for arm in (rig, ctl):
    for b in arm.data.bones:
        GROUP_OF[b.name] = b.get('group', 'core')


def bone_color(name):
    g = GROUP_OF.get(name, 'core'); c = GROUP_COL.get(g, (0.6, 0.6, 0.6))
    if name.endswith('_02'):
        c = tuple(min(1, 0.6 * x + 0.4) for x in c)
    elif name.endswith('_03'):
        c = tuple(0.55 * x for x in c)
    return c


rb.bone_color = bone_color
rb.VIEW_DIRS['back_top'] = (0.3, 1.0, 0.75)
rb.VIEW_DIRS['front_low'] = (0.35, -1.0, -0.15)

WIDE = {'front': ((0, 0, 0.42), 1.42), 'left': ((0, 0.02, 0.46), 1.02), 'three_quarter': ((0, 0, 0.42), 1.42)}
BODY = {'front': ((0, -0.02, 0.2), 0.62), 'left': ((0, 0.0, 0.2), 0.62), 'three_quarter': ((0, 0.0, 0.22), 0.66)}
HEADV = {'front': ((0, -0.08, 0.4), 0.5), 'left': ((0, -0.06, 0.38), 0.5), 'three_quarter': ((0, -0.06, 0.4), 0.52)}
cam = rb.setup_render(900)


def shoot(path, objs, view, ctr, size, color='TEXTURE', xray=False, alpha=0.4):
    c = Vector(ctr); lo = c - Vector((size,) * 3) / 2; hi = c + Vector((size,) * 3) / 2
    rb.place_camera(cam, lo, hi, view, center=c, size=size)
    rb.only_visible(objs); rb.shading(color, xray=xray, alpha=alpha)
    rb.render_to(path)


def project(p):
    R = cam.matrix_world.to_3x3(); right = R @ Vector((1, 0, 0)); up = R @ Vector((0, 1, 0))
    d = Vector(p) - cam.location; s = cam.data.ortho_scale
    return 0.5 + d.dot(right) / s, 0.5 + d.dot(up) / s


# ------------------------------------------------------------------ 1. skeleton over X-ray mesh (runtime) + control rig
qa.clear(ctl)
rb.set_point_colors(ob, [(0.82, 0.8, 0.76)] * N, name='rb_flat')
for b in ctl.data.bones:
    b.use_deform = True                      # only so that bone_proxy draws them coloured and thick (file not saved)
for arm, tag in ((rig, 'skel'), (ctl, 'ctl')):
    proxy = rb.bone_proxy(arm, posed=False, scale=0.85 if tag == 'skel' else 0.6, deform_only=False)
    views = (('front', WIDE['front']), ('left', ((0, 0.0, 0.3), 0.66)), ('back', WIDE['front']), ('topdown', ((0, 0.02, 0.3), 1.42))) \
        if tag == 'skel' else (('front', WIDE['front']), ('left', ((0, 0.0, 0.3), 0.66)))
    for v, (ctr, size) in views:
        shoot(f'{RAW}/{tag}_{v}.png', [ob], v, ctr, size, color='VERTEX', xray=True, alpha=0.45)
        shoot(f'{RAW}/{tag}_{v}_bones.png', [proxy], v, ctr, size, color='VERTEX')
        labels = []
        for b in arm.data.bones:
            if b.get('group') == 'socket' and tag == 'skel':
                u, w = project(b.head_local); labels.append(dict(name=b.name, u=u, v=w, group='socket'))
            elif tag == 'skel' and b.name.startswith(('L_', 'head', 'thorax', 'abdomen')):
                u, w = project((b.head_local + b.tail_local) / 2); labels.append(dict(name=b.name, u=u, v=w, group=b.get('group', '')))
            elif tag == 'ctl' and b.name.startswith(('ctl_L_Wing', 'ctl_wings', 'ctl_abdomen_curl', 'ctl_L_Leg1_IK', 'ctl_L_Leg1_pole', 'ctl_cog')):
                u, w = project((b.head_local + b.tail_local) / 2); labels.append(dict(name=b.name, u=u, v=w, group=b.get('group', '')))
        json.dump(labels, open(f'{RAW}/{tag}_{v}_labels.json', 'w'))
    bpy.data.objects.remove(proxy)

# ------------------------------------------------------------------ 2. weights (dominant colour mix)
rb.set_point_colors(ob, rb.weight_colors(ob), name='rb_w')
for v, (ctr, size) in (('front', WIDE['front']), ('back', WIDE['front']), ('left', ((0, 0.0, 0.3), 0.66)), ('three_quarter', WIDE['three_quarter']),
                       ('topdown', ((0, 0.02, 0.3), 1.42))):
    shoot(f'{RAW}/w_{v}.png', [ob], v, ctr, size, color='VERTEX')
for tag, v, ctr, size in (('w_legs_left', 'left', (0, 0.0, 0.11), 0.42), ('w_legs_front', 'front', (0.13, 0, 0.11), 0.34),
                          ('w_head_front', 'front', (0, -0.1, 0.42), 0.46), ('w_abd_left', 'left', (0, 0.12, 0.17), 0.36),
                          ('w_wings_back', 'back', (0.3, 0.1, 0.35), 0.75)):
    shoot(f'{RAW}/{tag}.png', [ob], v, ctr, size, color='VERTEX')
# per-chain views: one colour per bone of a chain, grey elsewhere
CH = {'legs': ['L_Leg1_01', 'L_Leg1_02', 'L_Leg1_03', 'L_Leg2_01', 'L_Leg2_02', 'L_Leg2_03', 'L_Leg3_01', 'L_Leg3_02', 'L_Leg3_03', 'thorax'],
      'body': ['thorax', 'abdomen_01', 'abdomen_02', 'abdomen_03'], 'wings': ['L_WingF_01', 'L_WingF_02', 'L_WingB_01', 'L_WingB_02'],
      'antenna': ['L_antenna_01', 'L_antenna_02', 'head']}
gn = [g.name for g in ob.vertex_groups]
for ch, bones in CH.items():
    pal = {b: colorsys.hsv_to_rgb(k / len(bones), 0.85, 0.95) for k, b in enumerate(bones)}
    cols = []
    for vtx in me.vertices:
        c = Vector((0.25, 0.25, 0.27)); t = 0
        for g in vtx.groups:
            n = gn[g.group]
            if n in pal:
                c += (Vector(pal[n]) - Vector((0.25, 0.25, 0.27))) * g.weight
        cols.append(tuple(c))
    rb.set_point_colors(ob, cols, name='rb_ch')
    view = {'legs': ('left', (0, 0.0, 0.12), 0.46), 'body': ('left', (0, 0.06, 0.2), 0.5), 'wings': ('back', (0.3, 0.1, 0.35), 0.75),
            'antenna': ('front', (0.06, -0.1, 0.45), 0.36)}[ch]
    shoot(f'{RAW}/wc_{ch}.png', [ob], *view, color='VERTEX')
    json.dump({b: [round(x, 3) for x in c] for b, c in pal.items()}, open(f'{RAW}/wc_{ch}_legend.json', 'w'))

# ------------------------------------------------------------------ 3. QA poses: texture (front / left / 3/4) + stretch heat
rb.VIEW_DIRS['back_three_quarter'] = (0.75, 0.75, 0.35)
ABD = {'left': ((0, 0.08, 0.2), 0.5), 'back_three_quarter': ((0, 0.08, 0.2), 0.55), 'topdown': ((0, 0.08, 0.2), 0.55),
       'three_quarter': ((0, 0.0, 0.22), 0.66)}
VIEWSET = {}
for name in qa.POSES:
    if name.startswith(('wing', 'flight', 'rest')):
        VIEWSET[name] = dict(WIDE, topdown=((0, 0.02, 0.3), 1.42)) if name == 'wing_sweep_20' else WIDE
    elif name.startswith(('antenna', 'head')):
        VIEWSET[name] = HEADV
    elif name.startswith('abdomen'):
        VIEWSET[name] = ABD
    else:
        VIEWSET[name] = BODY
for name, spec in qa.POSES.items():
    qa.apply(ctl, spec)
    for v, (ctr, size) in VIEWSET[name].items():
        shoot(f'{RAW}/pose_{name}_{v}.png', [ob], v, ctr, size, color='TEXTURE')
    rb.set_point_colors(ob, rb.stretch_colors(ob), name='rb_heat')
    ctr, size = VIEWSET[name]['three_quarter']
    shoot(f'{RAW}/pose_{name}_heat.png', [ob], 'three_quarter', ctr, size, color='VERTEX')
    if name.startswith(('legs', 'leg_', 'crouch')):
        shoot(f'{RAW}/pose_{name}_heat_left.png', [ob], 'left', *BODY['left'], color='VERTEX')
    if name.startswith('abdomen'):
        shoot(f'{RAW}/pose_{name}_heat_left.png', [ob], 'left', *ABD['left'], color='VERTEX')
        shoot(f'{RAW}/pose_{name}_heat_back.png', [ob], 'back_three_quarter', *ABD['back_three_quarter'], color='VERTEX')
qa.clear(ctl)

# ------------------------------------------------------------------ 4. wing layers close-up (L side): hind-wing verts inside the fore wing = red
isl_lab, isl = rb._islands(ob)


def role_of(k):
    tot = {}
    for i in isl[k][:50]:
        for g in me.vertices[i].groups:
            tot[gn[g.group]] = tot.get(gn[g.group], 0) + g.weight
    return max(tot, key=tot.get)


roles = [role_of(k) for k in range(len(isl))]
wF = np.array([i for k, c in enumerate(isl) if roles[k].startswith('L_WingF') for i in c])
wB = np.array([i for k, c in enumerate(isl) if roles[k].startswith('L_WingB') for i in c])
fF = qa.island_faces(me, wF)
layer_poses = ['rest', 'wings_up_65', 'wings_mid_30', 'wings_down_45', 'wingB_lag_10', 'wingB_lead_10', 'wing_flex_30', 'wing_twist_25',
               'wing_sweep_20', 'flight_combo']
me.calc_loop_triangles()
tri = np.array([t.vertices[:] for t in me.loop_triangles])
setF = set(wF.tolist()); setB = set(wB.tolist())
triF = tri[[all(v in setF for v in t) for t in tri]]; triB = tri[[all(v in setB for v in t) for t in tri]]


def sections(P, u, n, c, origin, stations):
    out = {}
    for st in stations:
        o = origin + u * st; res = {}
        for key, T in (('F', triF), ('B', triB)):
            segs = []
            d = (P - o) @ u
            for t in T:
                dv = d[list(t)]
                if dv.min() > 0 or dv.max() < 0:
                    continue
                pts = []
                for a_, b_ in ((0, 1), (1, 2), (2, 0)):
                    da, db = dv[a_], dv[b_]
                    if (da > 0) != (db > 0):
                        f = da / (da - db); q = P[t[a_]] + f * (P[t[b_]] - P[t[a_]])
                        pts.append([float((q - o) @ c), float((q - o) @ n)])
                if len(pts) == 2:
                    segs.append(pts[0] + pts[1])
            res[key] = segs
        out[f'{st:.3f}'] = res
    return out


lay = {}
Q0 = P0[wF]; c0 = Q0.mean(0); w_, V_ = np.linalg.eigh(np.cov((Q0 - c0).T)); o_ = np.argsort(w_)[::-1]
u0 = V_[:, o_[0]]; n0 = V_[:, o_[2]]
if (Q0[np.argmax(np.abs(Q0[:, 0]))] - c0) @ u0 < 0:
    u0 = -u0
if (P0[wB].mean(0) - c0) @ n0 < 0:
    n0 = -n0
ch0 = np.cross(n0, u0)
root0 = Q0[np.argmin((Q0 - c0) @ u0)]; span0 = float(((Q0 - root0) @ u0).max())
stations = [0.15 * span0, 0.28 * span0, 0.42 * span0]
Mrest = rig.data.bones['L_WingF_01'].matrix_local
for name in layer_poses:
    qa.apply(ctl, qa.POSES[name]); P = qa.positions(ob)
    ins, du = qa.near_inside(qa.bvh_of(P, fF), P[wB])
    T = (rig.matrix_world @ rig.pose.bones['L_WingF_01'].matrix @ Mrest.inverted()).inverted()
    Pr = np.array([(T @ Vector(p))[:] for p in P])          # posed mesh seen from the fore wing's root bone
    lay[name] = dict(inside=int(ins.sum()), min_gap_mm=round(float(du[~ins].min()) * 1000, 2) if (~ins).any() else None,
                     sections=sections(Pr, u0, n0, ch0, root0, stations))
json.dump(lay, open(f'{RAW}/layers_sections.json', 'w'))
qa.clear(ctl)

# ------------------------------------------------------------------ 5. sockets (markers at the socket heads) in a pose
for name in ('rest', 'wings_up_65'):
    qa.apply(ctl, qa.POSES[name])
    pts = []
    for b in rig.pose.bones:
        if rig.data.bones[b.name].get('group') == 'socket':
            pts.append((tuple(rig.matrix_world @ b.head), (1.0, 0.85, 0.1)))
            pts.append((tuple(rig.matrix_world @ b.tail), (1.0, 0.3, 0.1)))
    mk = pc.marker_object('_sockets', pts, radius=0.009)
    rb.set_point_colors(ob, [(0.8, 0.78, 0.74)] * N, name='rb_flat2')
    shoot(f'{RAW}/sockets_{name}.png', [ob, mk], 'three_quarter', *WIDE['three_quarter'], color='VERTEX', xray=True, alpha=0.5)
    labels = []
    for b in rig.pose.bones:
        if rig.data.bones[b.name].get('group') == 'socket':
            u, w = project(rig.matrix_world @ b.head); labels.append(dict(name=b.name, u=u, v=w, group='socket'))
    json.dump(labels, open(f'{RAW}/sockets_{name}_labels.json', 'w'))
    bpy.data.objects.remove(mk)
qa.clear(ctl)

# ------------------------------------------------------------------ 6. variant B (same rig, collapsed weights)
Wm = np.zeros((N, len(gn)))
for vtx in me.vertices:
    for g in vtx.groups:
        Wm[vtx.index, g.group] = g.weight
WB, nB = skin.collapse(Wm, gn, sk.B_COLLAPSE)
obB = ob.copy(); obB.data = ob.data.copy(); obB.name = 'P03_variant_B_tmp'; bpy.context.scene.collection.objects.link(obB)
for g in list(obB.vertex_groups):
    obB.vertex_groups.remove(g)
vgB = {n: obB.vertex_groups.new(name=n) for n in nB}
for i in range(N):
    for k in np.nonzero(WB[i] > 1e-9)[0]:
        vgB[nB[k]].add([i], float(WB[i, k]), 'REPLACE')
for name in ('legs_tuck', 'abdomen_down_45', 'antenna_fwd', 'flight_combo'):
    qa.apply(ctl, qa.POSES[name])
    vs = VIEWSET[name]['three_quarter']
    shoot(f'{RAW}/B_{name}.png', [obB], 'three_quarter', *vs, color='TEXTURE')
qa.clear(ctl)

# ------------------------------------------------------------------ 7. wing roots in the thorax fluff at the flap limits (texture)
rb.VIEW_DIRS['shoulder'] = (0.2, 0.6, 1.0)
for name in ('rest', 'wings_up_65', 'wings_down_45'):
    qa.apply(ctl, qa.POSES[name])
    for v, c, sz in (('shoulder', (0.0, 0.0, 0.33), 0.3), ('front', (0.0, -0.02, 0.32), 0.3)):
        shoot(f'{RAW}/root_{name}_{v}.png', [ob], v, c, sz, color='TEXTURE')
qa.clear(ctl)
print('R5_RENDER_DONE')
