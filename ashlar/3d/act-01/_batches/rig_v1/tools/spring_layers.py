"""Bone collections + spring bone config (rig editor / spring-bone.js format) for a rigged asset.

blender -b --factory-startup <asset>/rig/<aid>_rig.blend -P spring_layers.py -- <aid>

- Bone collections like PS Pyre Singer: Body (core deform), one per garment from SPRING['collections']
  ({name: [bone prefixes]}), Socket (non-deform: root, ground, cog, fx_*, attach points) hidden.
- Springs: one chain per hanging chain root (cloth chains of CLOTH, sleeve flaps, rigid/strand accessories) with the
  editor's presets (FL skirt/robe values), cloth layers (layer 0 = innermost garment, accessories outside it),
  ring links between angular neighbours of each garment, colliders from the editor preset plus the chest and upper
  arms when there are sleeve flaps. Collider radii = the editor's "auto radius" (Body vertices whose main bone is
  the collider bone, distance to the capsule segment / sphere centre, 55th percentile or `fit`).
- Writes <rig json base>_springbones.json (the file the editor's Spring mode opens and saves) and saves the .blend.
SPRING in tools/assets/<aid>.py may override: collections, chains {root: {params}}, layers {cloth part: n},
colliders (list), wind (dict); extra_chains [{root, params}] adds springs on bones of the asset's extra_chains().
"""
import bpy, sys, os, json, math, time, shutil, importlib
from mathutils import Vector

TOOLS = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, TOOLS); sys.path.insert(0, os.path.join(TOOLS, 'assets'))
import rigbatch as rb

AID = sys.argv[sys.argv.index('--') + 1]
A = importlib.import_module(AID)
k = getattr(A, 'K_HEIGHT', A.HEIGHT_M) / rb.REF_H
rc = rb.load_skill(k)
SP = getattr(A, 'SPRING', {}) or {}
rig = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
arm = rig.data; B = arm.bones
chains = json.loads(rig['rb_chains']); items = json.loads(rig.get('rb_items', '{}'))
names = [b.name for b in B]

# ------------------------------------------------------------------ bone collections
for c in list(arm.collections_all):
    arm.collections.remove(c)
groups = {}
coll_spec = SP.get('collections')
if not coll_spec:                     # default: one collection per garment, sleeve flaps, hanging props
    coll_spec = {lab.replace('Cloth_', ''): [sp['prefix'] + '_'] for lab, sp in (getattr(A, 'CLOTH', {}) or {}).items()}
    if any(n.startswith('sleeve_') for n in chains):
        coll_spec['Sleeves'] = ['sleeve_']
    acc_b = [b for it in items.values() if it.get('mode') in ('rigid', 'strand') for b in it.get('bones', [])]
    if acc_b:
        coll_spec['Accessory'] = acc_b
for cname, prefixes in coll_spec.items():
    groups[cname] = [n for n in names if any(n.startswith(p) for p in prefixes)]
taken = {n for v in groups.values() for n in v}
socket = [n for n in names if not B[n].use_deform and n not in taken]
body = [n for n in names if B[n].use_deform and n not in taken]
order = [('Body', body)] + list(groups.items()) + [('Socket', socket)]
for cname, bones in order:
    col = arm.collections.new(cname)
    for n in bones:
        col.assign(B[n])
    col.is_visible = cname != 'Socket'
print('collections', {c: len(v) for c, v in order})

# ------------------------------------------------------------------ spring chains
cloth = getattr(A, 'CLOTH', {}) or {}
layer_of = dict((SP.get('layers') or {}))
for i, label in enumerate(cloth):
    layer_of.setdefault(label, 0 if i == 0 else 1)
print('cloth layers', layer_of)
cfg_chains = []; links = []
SKIRT = dict(drag=0.45, gravity=0.4, hitRadius=round(0.06 * k, 3), endLength=round(0.1 * k, 3), wind=1.0)
for label, spec in cloth.items():
    ring = []
    for tag, ang in spec['chains']:
        cn = f"{spec['prefix']}_{tag}"
        if cn not in chains:
            continue
        a = ((ang + 180) % 360) - 180
        stiff = 1.5 if abs(a) < 60 else 1.6 if abs(a) < 120 else 1.7          # front swings most, back least
        if spec['prefix'].startswith('apron'):                               # editor presets: apron 1.6, flap 1.2
            stiff = 1.6
        elif spec['prefix'].startswith('flap'):
            stiff = 1.2
        cfg_chains.append(dict(root=chains[cn][0], enabled=True, stiffness=stiff, collide=True, layer=layer_of[label], **SKIRT))
        ring.append((ang % 360, chains[cn][0]))
    ring.sort()
    for j in range(len(ring)):
        a0, r0 = ring[j]; a1, r1 = ring[(j + 1) % len(ring)]
        gap = (a1 - a0) % 360
        if len(ring) >= 2 and r0 != r1 and gap < 120 and not any({r0, r1} == set(l_) for l_ in links):
            links.append([r0, r1])
for Pn in ('L', 'R'):
    if f'sleeve_{Pn}' in chains:
        cfg_chains.append(dict(root=chains[f'sleeve_{Pn}'][0], enabled=True, stiffness=1.2, drag=0.4, gravity=0.5,
                               hitRadius=round(0.04 * k, 3), endLength=round(0.05 * k, 3), collide=True, wind=0.8))
outer = (max(layer_of.values()) + 1) if layer_of else None
for name, it in items.items():
    if it.get('mode') in ('rigid', 'strand') and it.get('bones'):
        c = dict(root=it['bones'][0], enabled=True, stiffness=0.8, drag=0.3, gravity=0.8, hitRadius=round(0.04 * k, 3),
                 endLength=round(0.06 * k, 3), collide=True, wind=0.3)
        if outer is not None and it.get('mode') == 'rigid':
            c['layer'] = max(outer, 2)                                       # hanging prop: outside every garment
        cfg_chains.append(c)
for c in SP.get('extra_chains') or []:                                       # chains of extra_chains() (P05 pouches)
    if c['root'] in names:
        cfg_chains.append(dict(dict(enabled=True, collide=True), **c))
for c in cfg_chains:                                                         # per-root overrides from the asset
    c.update((SP.get('chains') or {}).get(c['root'], {}))

# ------------------------------------------------------------------ colliders (editor preset + auto radius)
def first_child(n):
    for m in names:
        if B[m].parent and B[m].parent.name == n:
            return m
    return None


def local(n, p):
    return list((B[n].matrix_local.inverted() @ Vector(p)).to_tuple(4))


cols = [dict(bone='pelvis', type='sphere'), dict(bone='spine_01', type='capsule'), dict(bone='spine_02', type='capsule'),
        dict(bone='L_Thigh', type='capsule'), dict(bone='R_Thigh', type='capsule'),
        dict(bone='L_Calf', type='capsule'), dict(bone='R_Calf', type='capsule'),
        dict(bone='L_Calf', type='sphere', at=0.1, fit=0.8), dict(bone='R_Calf', type='sphere', at=0.1, fit=0.8)]
if any(n.startswith('sleeve_') for n in chains):
    cols += [dict(bone='chest', type='capsule', tail_to='neck'),
             dict(bone='L_UpperArm', type='capsule', tail_to='L_ForeArm'), dict(bone='R_UpperArm', type='capsule', tail_to='R_ForeArm')]
cols = (SP.get('colliders') or cols) + list(SP.get('extra_colliders') or [])
out_cols = []; fixed_r = {}
for c in cols:
    n = c['bone']
    if n not in names:
        continue
    o = dict(bone=n, type=c['type'], radius=round(0.08 * k, 3))
    kid = first_child(n)
    if c.get('tail_to'):
        o['tail'] = local(n, B[c['tail_to']].head_local)                  # first child is a socket/twist bone
    if 'at' in c and kid:
        o['offset'] = [round(x * c['at'], 4) for x in local(n, B[kid].head_local)]
    if 'fit' in c:
        o['fit'] = c['fit']
    if 'offset' in c:                                                        # explicit bone-local offset
        o['offset'] = list(c['offset'])
    if 'shift' in c:                  # world-space move of the whole shape (B03: spine on the back, torso in front)
        sv = Vector(c['shift']); o['offset'] = local(n, B[n].head_local + sv)
        if c['type'] == 'capsule':
            tw = B[c['tail_to']].head_local if c.get('tail_to') else (B[kid].head_local if kid else B[n].tail_local)
            o['tail'] = local(n, tw + sv)
    if 'radius' in c:
        fixed_r[id(o)] = c['radius']
    out_cols.append(o)

bodyob = next(ob for ob in bpy.data.objects if ob.type == 'MESH' and ob.get('rb_role') == 'Body')
gn = [g.name for g in bodyob.vertex_groups]
M = rig.matrix_world.inverted() @ bodyob.matrix_world
main = {}
for v in bodyob.data.vertices:
    best = max(v.groups, key=lambda g: g.weight, default=None)
    if best is not None and best.weight >= 0.5:
        main.setdefault(gn[best.group], []).append(M @ v.co)


def seg(o):
    n = o['bone']; Mb = B[n].matrix_local
    a = Mb @ Vector(o.get('offset', (0, 0, 0)))
    kid = first_child(n)
    t = Vector(o['tail']) if 'tail' in o else (Mb.inverted() @ B[kid].head_local if kid else Vector((0, 0.1, 0)))
    return a, Mb @ t


zones = {}
for o in out_cols:
    if o['type'] == 'sphere' and 'offset' in o:
        a, b = seg(o); axis = (b - B[o['bone']].head_local).normalized()
        zones.setdefault(o['bone'], []).append((id(o), a, axis))
for o in out_cols:
    a, b = seg(o); zs = zones.get(o['bone'], []); d = []
    for p in main.get(o['bone'], []):
        mine = next((z for z in zs if z[0] == id(o)), None)
        inz = lambda z: abs((p - z[1]).dot(z[2])) < 0.08 * k
        if (not inz(mine)) if mine else any(inz(z) for z in zs):
            continue
        if o['type'] == 'capsule':
            ab = b - a; t = max(0.0, min(1.0, (p - a).dot(ab) / max(ab.length_squared, 1e-12))); d.append((p - (a + ab * t)).length)
        else:
            d.append((p - a).length)
    lr = (getattr(A, 'LM', {}) or {}).get('leg_radii') or {}
    if len(d) >= 8:
        d.sort(); o['radius'] = round(d[int(len(d) * o.get('fit', 0.55))], 3)
    elif lr:                          # no leg mesh (floor-length skirt): the push colliders' slim legs
        key = 'thigh_r' if 'Thigh' in o['bone'] else ('knee_r' if o['type'] == 'sphere' else 'calf_r') if 'Calf' in o['bone'] else None
        if key and key in lr:
            o['radius'] = round(lr[key], 3)
    if o['bone'] in (SP.get('radius') or {}) and 'offset' not in o:          # asset override (no mesh to measure)
        o['radius'] = SP['radius'][o['bone']]
    if id(o) in fixed_r:
        o['radius'] = fixed_r[id(o)]
    print(f"collider {o['bone']:12s} {o['type']:7s} r {o['radius']:.3f}  ({len(d)} verts)")

wind = dict(enabled=True, strength=0.3, dir=0, turbulence=1, gust=0.4)
wind.update(SP.get('wind') or {})
config = dict(chains=cfg_chains, colliders=out_cols, links=links, wind=wind, rig=rig.name, saved=time.strftime('%Y-%m-%d %H:%M:%S'))
base = os.path.splitext(bpy.data.filepath)[0] + '_' + rig.name
path = base + '_springbones.json'
if os.path.isfile(path):
    shutil.copy(path, path + '.bak')
with open(path, 'w', encoding='utf-8') as f:
    json.dump(config, f, indent=1)
rig['rb_spring'] = json.dumps(dict(file=os.path.basename(path), chains=len(cfg_chains), colliders=len(out_cols), links=len(links)))
rb.save(bpy.data.filepath)
print('SPRING_JSON', path)
for c in cfg_chains:
    print('  chain', c['root'], {kk: c[kk] for kk in ('stiffness', 'drag', 'gravity', 'hitRadius', 'endLength', 'wind')}, 'layer', c.get('layer'))
print('  links', links)
