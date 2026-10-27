"""U04 spring bones + cloth layers (rig editor / spring-bone.js format), read only on the saved rig.

blender -b --factory-startup rig/U04_charnel_ghoul_rig.blend -P u04_spring.py -- spring
  -> rig/editor/U04_charnel_ghoul_springbones.json (the file the editor's Spring mode opens and saves), rig/_work/spring.json

Same format and presets as rig_v1/tools/spring_layers.py (robe chains: front 1.5 / sides 1.6 / back 1.7, drag 0.45,
gravity 0.4; strand accessory: 0.8 / 0.3 / 0.8), adapted to a body lying along Y:
- layer 0 = the smock (6 chains), layer 1 = the neck tie (on top of the smock at the chest). smock_back comes first: a
  layer's axis is the +Y axis of its first chain's parent bone, here pelvis -> spine_01, i.e. along the spine.
- endLength = length of each chain's leaf bone, so the simulated tip is the hem.
- colliders: pelvis sphere, spine_01 / spine_02 / chest / neck capsules, upper arms, forearms, thighs, calves (knee ->
  hock); every capsule end is given (`tail`), since the first child of UpperArm / ForeArm is a twist bone. Radius =
  55th percentile of the distance from the body vertices mainly weighted to that bone (spring_layers' auto radius).
- links (cloth between neighbouring chains, an arc around the axis of chain a's parent) only where that arc lies outside
  every collider at bind, or inside by less than 0.15 r (pushed out to r at rest): the front and shoulder panels have an
  arm between them, and an arc through a limb would drag the panels with it.
spring-bone.js keeps any bind-pose overlap (a point closer than radius + hitRadius stays at its bind distance), so only
points between 0.85 r and r get pushed at rest; they are listed in the report.
"""
import bpy, os, sys, json, math, time, shutil
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import u04_qa as Q                          # mode 'spring': helpers only
from mathutils import Vector
C = Q.C; rt = Q.rt; ob = Q.ob
B = rt.data.bones
OUT = os.path.join(os.path.dirname(C.BLEND), 'editor', C.AID + '_springbones.json')
HIT_AT = (0.5, 1.0); ARC_AT = (0.25, 0.5, 0.75); LINK_HIT = 0.02

ROBE = dict(drag=0.45, gravity=0.4, hitRadius=0.045, wind=1.0)
CHAINS = [('smock_back_01', 1.7, 0), ('L_smock_flank_01', 1.6, 0), ('R_smock_flank_01', 1.6, 0),
          ('L_smock_shoulder_01', 1.6, 0), ('R_smock_shoulder_01', 1.6, 0), ('smock_front_01', 1.5, 0)]
TIE = dict(root='tie_01', stiffness=0.8, drag=0.3, gravity=0.8, hitRadius=0.02, wind=0.3, layer=1)
# ring around the body; a = the chain whose parent gives the arc axis (spine-side chain first)
LINK_CANDIDATES = [('smock_back_01', 'L_smock_flank_01'), ('smock_back_01', 'R_smock_flank_01'),
                   ('L_smock_flank_01', 'L_smock_shoulder_01'), ('R_smock_flank_01', 'R_smock_shoulder_01'),
                   ('smock_front_01', 'L_smock_shoulder_01'), ('smock_front_01', 'R_smock_shoulder_01')]
COLS = [('pelvis', 'sphere', None), ('spine_01', 'capsule', 'spine_02'), ('spine_02', 'capsule', 'chest'),
        ('chest', 'capsule', 'neck'), ('neck', 'capsule', 'neck_02')] + \
       [(f'{P}_{b}', 'capsule', f'{P}_{t}') for P in 'LR' for b, t in (('UpperArm', 'ForeArm'), ('ForeArm', 'Hand'),
                                                                        ('Thigh', 'Calf'), ('Calf', 'Calf_02'))]


def chain_bones(root):
    out = [B[root]]
    while True:
        kids = [c for c in out[-1].children]
        if not kids:
            return out
        out.append(kids[0])


def joints(root, end_len):
    """[(origin, tail)] per bone at bind, as spring-bone.js: tail = child head, leaf = head + Y * endLength."""
    js = []
    for b in chain_bones(root):
        h = b.head_local.copy()
        t = b.children[0].head_local.copy() if b.children else h + (b.matrix_local.to_3x3() @ Vector((0, 1, 0))) * end_len
        js.append((h, t))
    return js


# ---------------------------------------------------------------- chains
cfg_chains = []; jts = {}
for root, stiff, layer in CHAINS:
    leaf = chain_bones(root)[-1]
    c = dict(root=root, enabled=True, stiffness=stiff, collide=True, layer=layer, endLength=round(leaf.length, 3), **ROBE)
    cfg_chains.append(c); jts[root] = joints(root, leaf.length)
leaf = chain_bones(TIE['root'])[-1]
cfg_chains.append(dict(enabled=True, collide=True, endLength=round(leaf.length, 3), **TIE))
jts[TIE['root']] = joints(TIE['root'], leaf.length)

# ---------------------------------------------------------------- colliders (auto radius)
gname = {g.index: g.name for g in ob.vertex_groups}
main = {}
for i, v in enumerate(ob.data.vertices):
    if Q.role[i] != 'body' or not v.groups:
        continue
    g = max(v.groups, key=lambda x: x.weight)
    if g.weight >= 0.5:
        main.setdefault(gname[g.group], []).append(Vector(Q.REST[i]))


def local(n, p):
    return [round(x, 4) for x in (B[n].matrix_local.inverted() @ Vector(p))]


def seg_pts(o):
    M = B[o['bone']].matrix_local
    a = M @ Vector(o.get('offset', (0, 0, 0)))
    return a, (M @ Vector(o['tail'])) if o['type'] == 'capsule' else a


def axis_dist(p, o):
    a, b = seg_pts(o)
    if o['type'] != 'capsule':
        return (p - a).length
    ab = b - a; t = max(0.0, min(1.0, (p - a).dot(ab) / max(ab.length_squared, 1e-12)))
    return (p - (a + ab * t)).length


cfg_cols = []; col_info = {}
for bone, typ, tail_to in COLS:
    o = dict(bone=bone, type=typ, radius=0.08)
    if typ == 'capsule':
        o['tail'] = local(bone, B[tail_to].head_local)
    d = sorted(axis_dist(p, o) for p in main.get(bone, []))
    if len(d) >= 8:
        o['radius'] = round(d[int(len(d) * 0.55)], 3)
    cfg_cols.append(o); col_info[f'{bone}/{typ}'] = dict(radius=o['radius'], verts=len(d))


def clearance(r, hit, bd):                  # spring-bone.js
    return min(r + hit, max(bd, r) if bd >= 0.85 * r else bd)


# ---------------------------------------------------------------- bind check: points pushed at rest
pops = {}
for c in cfg_chains:
    worst = (0.0, None)
    for k, (h, t) in enumerate(jts[c['root']]):
        for f in HIT_AT:
            p = h.lerp(t, f)
            for o in cfg_cols:
                bd = axis_dist(p, o); lim = clearance(o['radius'], c['hitRadius'], bd)
                if lim - bd > worst[0]:
                    worst = (lim - bd, f"{o['bone']} (đốt {k + 1}, {f:.1f})")
    pops[c['root']] = dict(push_m=round(worst[0], 4), at=worst[1])


# ---------------------------------------------------------------- links: arc outside every collider at bind
def arc(pa, pb, t, ctr, up):
    ra = pa - ctr; rb = pb - ctr; ha = ra.dot(up); hb = rb.dot(up)
    ra = ra - up * ha; rb = rb - up * hb; la, lb = ra.length, rb.length
    if la < 1e-6 or lb < 1e-6:
        return pa.lerp(pb, t)
    d = (ra * ((1 - t) / la) + rb * (t / lb)).normalized()
    return d * (la + (lb - la) * t) + up * (ha + (hb - ha) * t) + ctr


links = []; link_info = {}
for a_, b_ in LINK_CANDIDATES:
    par = B[a_].parent; ctr = par.head_local; up = (par.matrix_local.to_3x3() @ Vector((0, 1, 0))).normalized()
    worst = (1e9, None, 0.0)
    for (ha, ta), (hb, tb) in zip(jts[a_], jts[b_]):
        for f in HIT_AT:
            pa, pb = ha.lerp(ta, f), hb.lerp(tb, f)
            for t in ARC_AT:
                p = arc(pa, pb, t, ctr, up)
                for o in cfg_cols:
                    m = axis_dist(p, o) - o['radius']
                    if m < worst[0]:
                        worst = (m, o['bone'], o['radius'])
    # outside, or inside by less than 0.15 r (spring-bone.js then only pushes it out to r at rest, a few mm)
    ok = worst[0] >= -0.15 * worst[2]
    link_info[f'{a_} - {b_}'] = dict(kept=ok, min_gap_m=round(worst[0], 4), nearest=worst[1])
    if ok:
        links.append([a_, b_])

wind = dict(enabled=True, strength=0.3, dir=0, turbulence=1, gust=0.4)
config = dict(chains=cfg_chains, colliders=cfg_cols, links=links, wind=wind, rig=rt.name, saved=time.strftime('%Y-%m-%d %H:%M:%S'))
os.makedirs(os.path.dirname(OUT), exist_ok=True)
if os.path.isfile(OUT):
    shutil.copy(OUT, OUT + '.bak')
with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(config, f, indent=1)
rep = dict(file=OUT, chains={c['root']: dict(layer=c.get('layer'), stiffness=c['stiffness'], endLength=c['endLength'],
                                             hitRadius=c['hitRadius'], rest_push=pops[c['root']]) for c in cfg_chains},
           colliders=col_info, links=link_info)
C.save_json(os.path.join(C.WORK, 'spring.json'), rep)
print('SPRING_JSON', OUT)
print(json.dumps(rep, ensure_ascii=False, indent=1))
