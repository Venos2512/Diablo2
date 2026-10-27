"""Stage-1 measurements for writing an asset config (read-only on s0_intake.blend).

blender -b --factory-startup tmp/rig_v1/<AID>/s0_intake.blend -P analyze.py -- <AID> <height_m>

Prints and writes tmp/rig_v1/<AID>/an.json: per-island mirror axis + extents (islands >= 20 verts), boundary
loops of the islands (n, centre, z-range: hems, sleeve openings, neck holes), touch graph, torso mirror axis per
10 cm band, the L/R arm-side components (islands whose x-centre is beyond 0.25H) and their outer tips.
Renders close-ups with a 5 cm grid (compose.py gridlines): head front/left, L arm front/top, feet left.
"""
import bpy, sys, os, json, math, collections
TOOLS = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, TOOLS)
import rigbatch as rb

argv = sys.argv[sys.argv.index('--') + 1:]
AID, H = argv[0], float(argv[1])
WORK = os.path.join(os.path.dirname(bpy.data.filepath))
rc = rb.load_skill(H / rb.REF_H); k = rb.K
ob = bpy.data.objects[AID + '_Src']; m = ob.data
lab, isl = rb._islands(ob)
V = [v.co.copy() for v in m.vertices]
out = dict(asset=AID, H=H, islands={}, loops=[], touch={}, torso_bands={})
for kk, c in enumerate(isl):
    if len(c) < 20:
        continue
    Pts = [V[i] for i in c]
    ax = rc.mirror_center(Pts, lo=-0.10 * k, hi=0.10 * k, step=0.001, cap=0.05 * k)
    out['islands'][kk] = dict(n=len(c), axis=round(ax[0], 4), err=round(ax[1], 4),
                              x=[round(min(p.x for p in Pts), 3), round(max(p.x for p in Pts), 3)],
                              y=[round(min(p.y for p in Pts), 3), round(max(p.y for p in Pts), 3)],
                              z=[round(min(p.z for p in Pts), 3), round(max(p.z for p in Pts), 3)],
                              c=[round(sum(p.x for p in Pts) / len(Pts), 3), round(sum(p.y for p in Pts) / len(Pts), 3),
                                 round(sum(p.z for p in Pts) / len(Pts), 3)])
for L in rb.boundary_loops(ob):
    if len(L) < 6:
        continue
    Pts = [V[i] for i in L]
    out['loops'].append(dict(island=lab[L[0]], n=len(L), c=[round(sum(p.x for p in Pts) / len(Pts), 3), round(sum(p.y for p in Pts) / len(Pts), 3),
                                                        round(sum(p.z for p in Pts) / len(Pts), 3)],
                             x=[round(min(p.x for p in Pts), 3), round(max(p.x for p in Pts), 3)],
                             z=[round(min(p.z for p in Pts), 3), round(max(p.z for p in Pts), 3)]))
out['loops'].sort(key=lambda r: -r['n'])
adj = rc.touch_graph(ob, tol=1e-4)
out['touch'] = {int(a): sorted(int(x) for x in b) for a, b in adj.items()}
big = max(range(len(isl)), key=lambda kk: len(isl[kk]))
T = [V[i] for i in isl[big]]
for z0 in [round(0.05 * H * j, 3) for j in range(2, 20)]:
    S = [p for p in T if z0 <= p.z < z0 + 0.05 * H and abs(p.x) < 0.25 * H]
    if len(S) > 15:
        c, e = rc.mirror_center(S, lo=-0.10 * k, hi=0.10 * k, step=0.001, cap=0.05 * k)
        out['torso_bands'][f'{z0:.2f}'] = [round(c, 4), round(e, 4), len(S)]
# arm-side components and tips
for side in (1, -1):
    comps = [(kk, isl[kk]) for kk in range(len(isl)) if side * sum(V[i].x for i in isl[kk]) / len(isl[kk]) > 0.25 * H and len(isl[kk]) >= 20]
    tip = max((side * V[i].x for _, c in comps for i in c), default=None)
    out['arm_' + ('L' if side > 0 else 'R')] = dict(components=[kk for kk, _ in comps], tip=round(tip, 4) if tip else None)
json.dump(out, open(os.path.join(WORK, 'an.json'), 'w'), indent=1)
print(json.dumps({kk: v for kk, v in out.items() if kk != 'islands'}, indent=None)[:6000])
for kk, r in sorted(out['islands'].items(), key=lambda t: -t[1]['n']):
    print('isl', kk, r)
# close-ups
top = max(p.z for p in V)
hd = [p for p in V if p.z > top - 0.16 * H and abs(p.x) < 0.15 * H]
hx = sum(p.x for p in hd) / len(hd); hy = sum(p.y for p in hd) / len(hd)
objs = [ob]
rb.render_closeup(os.path.join(WORK, 'an_head_front.png'), objs, (hx, hy, top - 0.11 * H), 0.26 * H, 'front', res=900)
rb.render_closeup(os.path.join(WORK, 'an_head_left.png'), objs, (hx, hy, top - 0.11 * H), 0.26 * H, 'left', res=900)
armz = sorted(p.z for p in V if p.x > 0.30 * H)
az = armz[len(armz) // 2] if armz else 0.8 * H
rb.render_closeup(os.path.join(WORK, 'an_armL_front.png'), objs, (0.30 * H, 0.0, az - 0.05 * H), 0.42 * H, 'front', res=1000)
rb.render_closeup(os.path.join(WORK, 'an_armL_top.png'), objs, (0.30 * H, 0.0, az), 0.42 * H, 'topdown', res=1000)
rb.render_closeup(os.path.join(WORK, 'an_waist_front.png'), objs, (0.0, 0.0, 0.55 * H), 0.55 * H, 'front', res=1000)
rb.render_closeup(os.path.join(WORK, 'an_waist_left.png'), objs, (0.0, 0.0, 0.55 * H), 0.55 * H, 'left', res=1000)
print('AN_DONE')
