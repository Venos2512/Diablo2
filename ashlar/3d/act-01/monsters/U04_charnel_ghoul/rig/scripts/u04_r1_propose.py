"""R1 proposal: build the proposed runtime skeleton on the mesh (scaled) and render overlays for G1.

blender -b --factory-startup -P u04_r1_propose.py -- [A|B]
Writes rig/_work/r1_layout.json and rig/_work/p_*.png (+ _bones.png passes); no .blend is saved.
"""
import bpy, os, sys, json, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import u04_common as C
import u04_joints as UJ
import u04_layout as UL
from mathutils import Vector
from mathutils.bvhtree import BVHTree
rb = C.rb

a = C.argv(); opt = a[0] if a else 'A'
S = UJ.SCALE_OPTIONS[opt]['s']
ob = C.import_glb(S)
me = ob.data; V = [v.co.copy() for v in me.vertices]
wid, nw = C.weld_ids(ob)
lab, isl = C.welded_islands(ob, wid)
role = {0: 'body', 1: 'smock', 2: 'hood', 3: 'tie'}
R = [role.get(lab[i], 'tooth') for i in range(len(V))]
body_faces = [tuple(p.vertices) for p in me.polygons if R[p.vertices[0]] == 'body']
bvh = BVHTree.FromPolygons(V, body_faces)

# ---- smock chains (L + centre measured, R mirrored)
reg = {}
for i, p in enumerate(V):
    if R[i] != 'smock':
        continue
    d = bvh.find_nearest(p)[3] / S
    n = UJ.smock_region(p.x / S, p.y / S, p.z / S, d)
    if n:
        reg.setdefault(n, []).append((i, d))
chains = {}; chain_info = {}
for name, (parent, why) in UJ.SMOCK_CHAINS.items():
    vs = [V[i] for i, d in reg.get(name, []) if d > 0.03]          # clearly hanging (3 cm Tripo units off the skin)
    if name.startswith('L_'):
        vs = [p for p in vs if p.x > 0]
    zt, zb = max(p.z for p in vs), min(p.z for p in vs)
    top = [p for p in vs if p.z > zt - 0.20 * (zt - zb)]; bot = [p for p in vs if p.z < zb + 0.15 * (zt - zb)]
    t = sum(top, Vector()) / len(top); b = sum(bot, Vector()) / len(bot)
    t = Vector(UJ.SMOCK_ROOTS[name]) * S                             # root on the line where the panel leaves the skin
    if not name.startswith('L_'):
        t.x = b.x = 0.0
    pts = [t, t.lerp(b, 0.5), b]
    chains[name] = (parent, pts)
    chain_info[name] = dict(parent=parent, n_all=len(reg.get(name, [])), n_hanging=len(vs), top=C.r(t), tip=C.r(b), why=why)
    if name.startswith('L_'):
        rn = 'R_' + name[2:]; rp = parent.replace('L_', 'R_')
        chains[rn] = (rp, [UL.mir(q) for q in pts])
        chain_info[rn] = dict(parent=rp, mirror_of=name, n_all=len(reg.get(rn, [])))
Jm = UJ.scaled(S)
bones = UL.layout(Jm, chains, S)
rig = UL.build_armature('U04_proposal', bones)

# ---- overlays
proxy = rb.bone_proxy(rig, posed=False, scale=1.0)
pre = os.path.join(C.WORK, 'p')
sh = bpy.context.scene.display.shading
rb.render_views(pre + '_tex', [ob], views=('front', 'left'), color_type='TEXTURE', res=900, frame_objs=[ob])
for v in ('front', 'left', 'back', 'topdown', 'three_quarter'):
    cam = rb.setup_render(1100); lo, hi = rb.frame_box([ob]); rb.place_camera(cam, lo, hi, v)
    rb.only_visible([ob]); sh.color_type = 'SINGLE'; sh.single_color = (0.80, 0.78, 0.74); sh.show_xray = True; sh.xray_alpha = 0.22
    rb.render_to(f'{pre}_xray_{v}.png')
    rb.only_visible([proxy]); rb.shading('VERTEX', xray=False); rb.render_to(f'{pre}_xray_{v}_bones.png')
sh.show_xray = False
for o in bpy.context.scene.objects:
    o.hide_render = False
# head / neck / jaw close-up (side + front)
hc = Vector((0, Jm['head'][1] - 0.02 * S, (Jm['jaw_end'][2] + 0.985 * S) / 2))
for v in ('left', 'front'):
    rb.render_closeup(f'{pre}_head_{v}.png', [ob], hc, 0.50 * S, v, color_type='TEXTURE', xray=True, alpha=0.30, res=900)
    rb.render_closeup(f'{pre}_head_{v}_bones.png', [proxy], hc, 0.50 * S, v, color_type='VERTEX', res=900)
# smock regions (chain colours) front / left / back
cols = []
pal = {}
for k, n in enumerate(sorted(chain_info)):
    pal[n] = rb.CLOTH_PALETTE[k % len(rb.CLOTH_PALETTE)]
rmap = {}
for n, lst in reg.items():
    for i, d in lst:
        rmap[i] = n
for i in range(len(V)):
    if i in rmap:
        cols.append(pal.get(rmap[i], (1, 1, 1)))
    elif R[i] == 'smock':
        cols.append((0.80, 0.80, 0.80))
    elif R[i] == 'hood':
        cols.append((0.45, 0.85, 0.30))
    elif R[i] == 'tie':
        cols.append((0.85, 0.15, 0.20))
    elif R[i] == 'tooth':
        cols.append((1.0, 0.9, 0.2))
    else:
        cols.append((0.42, 0.40, 0.38))
rb.set_point_colors(ob, cols, name='u04_reg')
rb.render_views(pre + '_reg', [ob], views=('front', 'left', 'back'), color_type='VERTEX', res=900)

out = dict(option=opt, scale=S, scale_label=UJ.SCALE_OPTIONS[opt]['label'],
           height_m=round(max(p.z for p in V), 4), length_m=round(max(p.y for p in V) - min(p.y for p in V), 4),
           width_m=round(max(p.x for p in V) - min(p.x for p in V), 4),
           bones=[dict(name=b['name'], parent=b['parent'], kind=b['kind'], deform=b['deform'], head=C.r(b['head']),
                       tail=C.r(b['tail']), length=round((b['tail'] - b['head']).length, 4),
                       color=[round(c, 3) for c in (rb.bone_color(b['name']) if b['deform'] else (0.55, 0.55, 0.55))])
                  for b in bones],
           chains=chain_info, palette={k: [round(c, 3) for c in v] for k, v in pal.items()},
           counts=dict(total=len(bones), deform=sum(1 for b in bones if b['deform']),
                       sockets=sum(1 for b in bones if b['kind'] == 'socket')))
C.save_json(os.path.join(C.WORK, f'r1_layout_{opt}.json'), out)
print('R1_PROPOSE_DONE', out['counts'], out['height_m'], out['length_m'])
