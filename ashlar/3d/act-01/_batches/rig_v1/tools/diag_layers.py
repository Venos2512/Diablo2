"""Diagnostics on a stage snapshot: per-island mirror axes, boundary loops, and cloth layers.

blender -b <snapshot.blend> -P diag_layers.py -- <asset_id> <island ids comma> [object name]

Prints: mirror axis of each listed island and of left/right island pairs; boundary loops (length,
z-range, centre) of the listed islands; for the first island, centre-back / centre-front / side
slices showing how many surface layers the mesh has at each height (y or x clusters).
"""
import bpy, bmesh, sys, os, json, math, collections
TOOLS = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, TOOLS)
import rigbatch as rb

argv = sys.argv[sys.argv.index('--') + 1:]
AID = argv[0]; IDS = [int(x) for x in argv[1].split(',')]
OBN = argv[2] if len(argv) > 2 else AID + '_Src'
rc = rb.load_skill(1.0)
ob = bpy.data.objects[OBN]; me = ob.data
lab, isl = rb._islands(ob)
V = [v.co.copy() for v in me.vertices]
H = max(p.z for p in V)

for k in IDS:
    P = [V[i] for i in isl[k]]
    c, e = rc.mirror_center(P, lo=-0.12, hi=0.12, step=0.001, cap=0.05)
    print(f'island {k}: n={len(P)} mirror x={c:+.4f} err={e:.4f}  x[{min(p.x for p in P):+.3f},{max(p.x for p in P):+.3f}] '
          f'z[{min(p.z for p in P):.3f},{max(p.z for p in P):.3f}]')

# boundary loops of the listed islands
bm = bmesh.new(); bm.from_mesh(me); bm.verts.ensure_lookup_table(); bm.edges.ensure_lookup_table()
bedges = [e for e in bm.edges if e.is_boundary]
adj = collections.defaultdict(list)
for e in bedges:
    a, b = e.verts[0].index, e.verts[1].index
    adj[a].append(b); adj[b].append(a)
seen = set(); loops = []
for s in adj:
    if s in seen:
        continue
    comp = []; st = [s]; seen.add(s)
    while st:
        a = st.pop(); comp.append(a)
        for b in adj[a]:
            if b not in seen:
                seen.add(b); st.append(b)
    loops.append(comp)
print('boundary loops (island: n verts, z-range, centre):')
for comp in sorted(loops, key=lambda c: -len(c)):
    kk = lab[comp[0]]
    if kk not in IDS:
        continue
    P = [V[i] for i in comp]
    cz = sum(p.z for p in P) / len(P)
    print(f'  isl {kk}: n{len(comp):4d} z[{min(p.z for p in P):.3f},{max(p.z for p in P):.3f}] '
          f'c=({sum(p.x for p in P)/len(P):+.3f},{sum(p.y for p in P)/len(P):+.3f},{cz:.3f}) '
          f'x[{min(p.x for p in P):+.3f},{max(p.x for p in P):+.3f}] y[{min(p.y for p in P):+.3f},{max(p.y for p in P):+.3f}]')
bm.free()

# layer slices of the first island
k0 = IDS[0]; S0 = [V[i] for i in isl[k0]]
def clusters(vals, gap):
    vals = sorted(vals); out = [[vals[0], vals[0]]] if vals else []
    for v in vals[1:]:
        if v - out[-1][1] > gap:
            out.append([v, v])
        else:
            out[-1][1] = v
    return [(round(a, 3), round(b, 3)) for a, b in out]
cx = float(argv[3]) if len(argv) > 3 else 0.0
print(f'layers of island {k0} (gap 0.012 m), centre x={cx}:')
for z in [round(H * f, 3) for f in (0.88, 0.84, 0.80, 0.76, 0.72, 0.68, 0.64, 0.60, 0.56, 0.52, 0.48, 0.44, 0.40, 0.36, 0.32, 0.28, 0.24, 0.20)]:
    band = [p for p in S0 if abs(p.z - z) < 0.006]
    back = [p.y for p in band if abs(p.x - cx) < 0.03 and p.y > 0]
    front = [p.y for p in band if abs(p.x - cx) < 0.03 and p.y < 0]
    side = [p.x for p in band if abs(p.y) < 0.03 and p.x > cx]
    print(f'  z={z:.3f}  back y {clusters(back, 0.012)}  front y {clusters(front, 0.012)}  L side x {clusters(side, 0.012)}')
