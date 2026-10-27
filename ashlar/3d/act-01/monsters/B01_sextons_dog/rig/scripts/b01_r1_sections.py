"""B01 R1: exact plane sections of the scaled mesh (the mesh is too sparse for vertex slabs).

blender -b --factory-startup -P b01_r1_sections.py -- <plane>=<value> ...      e.g. x=0 x=0.22 y=-0.38 z=0.3

Writes rig/_work/sec_<plane><value>.json: segments [u0, v0, u1, v1, island_rank] in the plane's (u, v) axes
(x: u=y v=z; y: u=x v=z; z: u=x v=y). Island rank 0 = body, 1 = collar, 2-4 = chain + ring, 5+ = rivets.
"""
import bpy, bmesh, sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import b01_common as C

argv = sys.argv[sys.argv.index('--') + 1:]
ob, info = C.intake()
me = ob.data
bm = bmesh.new(); bm.from_mesh(me); bm.verts.ensure_lookup_table()
lab = [-1] * len(bm.verts); comps = []
for v in bm.verts:
    if lab[v.index] >= 0:
        continue
    k = len(comps); lab[v.index] = k; st = [v]; n = 0
    while st:
        a = st.pop(); n += 1
        for e in a.link_edges:
            b = e.other_vert(a)
            if lab[b.index] < 0:
                lab[b.index] = k; st.append(b)
    comps.append(n)
# importer-merged mesh can keep a few duplicates at hard edges: rank islands by size after a positional merge
rank_of = {k: r for r, k in enumerate(sorted(range(len(comps)), key=lambda k: -comps[k]))}
AX = {'x': (0, 1, 2), 'y': (1, 0, 2), 'z': (2, 0, 1)}
for spec in argv:
    pl, val = spec.split('='); val = float(val)
    ai, iu, iv = AX[pl]; segs = []
    for f in bm.faces:
        pts = [v.co for v in f.verts]; ds = [p[ai] - val for p in pts]; cut = []
        for i in range(len(pts)):
            a, b = pts[i], pts[(i + 1) % len(pts)]; da, db = ds[i], ds[(i + 1) % len(pts)]
            if (da < 0) != (db < 0):
                cut.append(a.lerp(b, da / (da - db)))
        if len(cut) >= 2:
            segs.append([round(cut[0][iu], 5), round(cut[0][iv], 5), round(cut[1][iu], 5), round(cut[1][iv], 5),
                         rank_of[lab[f.verts[0].index]]])
    C.jdump(os.path.join(C.WORK, f'sec_{pl}{val:+.3f}.json'), dict(plane=pl, value=val, axes='xyz'[iu] + 'xyz'[iv], segs=segs))
    print('[b01] section', pl, val, len(segs))
bm.free()
print('B01_SECTIONS_DONE', comps[:5], len(comps))
