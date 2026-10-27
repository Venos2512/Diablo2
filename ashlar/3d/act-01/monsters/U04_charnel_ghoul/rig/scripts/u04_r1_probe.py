"""R1 probe for U04 (read only): islands, exact sections of the body, renders with camera sidecars.

blender -b --factory-startup -P u04_r1_probe.py -- [scale]

Works in Tripo units (scale 1 = the GLB as is: x/y centred, soles on z = 0, faces -Y) unless a scale is given.
Writes rig/_work/r1_probe.json, rig/_work/r1_sec_x0.json and renders rig/_work/r1_*.png (+ _cam.json).
"""
import bpy, os, sys, json, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import u04_common as C
from mathutils import Vector
rb = C.rb

a = C.argv(); S = float(a[0]) if a else 1.0
ob = C.import_glb(S)
me = ob.data; V = [v.co.copy() for v in me.vertices]
wid, nw = C.weld_ids(ob)
lab, isl = C.welded_islands(ob, wid)
C.log('verts', len(V), 'welded', nw, 'islands', len(isl), [len(c) for c in isl[:6]])

# ---- classify islands: body = largest; smock/hood/tie by size order; small = teeth
names = {}
for k, c in enumerate(isl):
    P = [V[i] for i in c]
    lo = Vector((min(p.x for p in P), min(p.y for p in P), min(p.z for p in P)))
    hi = Vector((max(p.x for p in P), max(p.y for p in P), max(p.z for p in P)))
    names[k] = dict(n=len(c), nw=len({wid[i] for i in c}), lo=C.r(lo), hi=C.r(hi), c=C.r(sum(P, Vector()) / len(P)))
order = list(range(len(isl)))
role = {}
role[order[0]] = 'body'
rest = [k for k in order[1:] if names[k]['nw'] > 40]
for k, nm in zip(rest, ('smock', 'hood', 'tie')):
    role[k] = nm
for k in order:
    role.setdefault(k, 'tooth')
for k in names:
    names[k]['role'] = role[k]
C.log({k: (v['role'], v['nw']) for k, v in names.items()})

faces = [tuple(p.vertices) for p in me.polygons]
body_faces = [f for f in faces if role[lab[f[0]]] == 'body']


def loops_at(axis, val, fl, min_len=0.004):
    out = []
    for L in C.section_loops(V, fl, axis, val, min_len=min_len):
        out.append(dict(c=C.r(L['c']), lo=C.r(L['lo']), hi=C.r(L['hi']), length=C.r(L['length']), n=L['n']))
    return out


zsec = {f'{z:.3f}': loops_at('z', z, body_faces) for z in [0.005 + 0.01 * i for i in range(int(max(v.z for v in V) / 0.01))]}
ysec = {f'{y:+.3f}': loops_at('y', y, body_faces) for y in [-0.49 + 0.02 * i for i in range(50)]}
xsec = {f'{x:+.3f}': loops_at('x', x, body_faces) for x in [-0.30 + 0.02 * i for i in range(31)]}

# sagittal section of everything for drawing (segments with role)
seg_out = []
for rl in ('body', 'smock', 'hood', 'tie', 'tooth'):
    fl = [f for f in faces if role[lab[f[0]]] == rl]
    for L in C.section_loops(V, fl, 'x', 0.0):
        for p, q in L['segs']:
            seg_out.append([round(p.y, 5), round(p.z, 5), round(q.y, 5), round(q.z, 5), rl])
C.save_json(os.path.join(C.WORK, 'r1_sec_x0.json'), dict(plane='x', value=0.0, axes=['y', 'z'], segs=seg_out))

# ---- renders: textured + island colours
COL = {'body': (0.85, 0.60, 0.55), 'smock': (0.35, 0.55, 0.95), 'hood': (0.45, 0.85, 0.30), 'tie': (0.80, 0.45, 0.90),
       'tooth': (1.0, 0.9, 0.2)}
rb.set_point_colors(ob, [COL[role[lab[i]]] for i in range(len(V))], name='u04_isl')
P = os.path.join(C.WORK, 'r1_tex')
rb.render_views(P, [ob], views=('front', 'left', 'back', 'topdown', 'three_quarter'), color_type='TEXTURE', res=1100)
rb.render_views(os.path.join(C.WORK, 'r1_isl'), [ob], views=('front', 'left', 'back', 'topdown'), color_type='VERTEX', res=1100)
# x-ray island view from the side (hidden limbs / jaw cavity)
rb.render_views(os.path.join(C.WORK, 'r1_xray'), [ob], views=('left', 'front'), color_type='VERTEX', res=1100, xray=True)
# close-ups: head side + front, near hand, near foot (left side = +x)
hd = [V[i] for i in isl[0] if V[i].z > 0.6 * S and V[i].y < -0.2 * S]
hc = sum(hd, Vector()) / len(hd)
rb.render_closeup(os.path.join(C.WORK, 'r1_head_left.png'), [ob], hc, 0.42 * S, 'left', res=1000)
rb.render_closeup(os.path.join(C.WORK, 'r1_head_front.png'), [ob], hc, 0.42 * S, 'front', res=1000)
rb.render_closeup(os.path.join(C.WORK, 'r1_head_left_x.png'), [ob], hc, 0.42 * S, 'left', color_type='VERTEX', xray=True, alpha=0.4, res=1000)

out = dict(asset=C.AID, scale=S, verts=len(V), welded=nw, islands=names,
           bbox=dict(lo=C.r(Vector((min(p.x for p in V), min(p.y for p in V), min(p.z for p in V)))),
                     hi=C.r(Vector((max(p.x for p in V), max(p.y for p in V), max(p.z for p in V))))),
           zsec=zsec, ysec=ysec, xsec=xsec)
C.save_json(os.path.join(C.WORK, 'r1_probe.json'), out)
print('R1_PROBE_DONE')
