"""Cross-sections of mesh objects: mesh ∩ plane, drawn as 2D polylines coloured by island.

blender -b --factory-startup <file.blend> -P section.py -- <out_prefix> <objects comma|*> <plane>=<value> [...]
  plane: x | y | z   e.g.  x=0.0 x=0.12 z=1.0
Writes <out_prefix>_<plane><value>.json with segments; then draws <...>.png (PIL via a subprocess of
system python is not available inside Blender, so drawing happens in compose_section() below when run
with system python:  python -E section.py draw <json> <png>).
"""
import sys, os, json

if len(sys.argv) > 1 and sys.argv[1] == 'draw':
    from PIL import Image, ImageDraw, ImageFont
    import colorsys
    d = json.load(open(sys.argv[2])); out = sys.argv[3]
    segs = d['segs']; ax = d['axes']
    if not segs:
        print('no segments'); sys.exit(0)
    us = [s[c] for s in segs for c in (0, 2)]; vs = [s[c] for s in segs for c in (1, 3)]
    u0, u1, v0, v1 = min(us), max(us), min(vs), max(vs)
    S = 1100; pad = 40; sc = (S - 2 * pad) / max(u1 - u0, v1 - v0, 1e-6)
    W = int((u1 - u0) * sc) + 2 * pad; Hh = int((v1 - v0) * sc) + 2 * pad
    im = Image.new('RGB', (W, Hh), (30, 30, 34)); dr = ImageDraw.Draw(im)
    try:
        f = ImageFont.truetype('arial.ttf', 14)
    except OSError:
        f = ImageFont.load_default()
    # 5 cm grid
    g = 0.05
    import math
    for gu in [u0 + i * g for i in range(int((u1 - u0) / g) + 2)]:
        x = pad + (math.floor(gu / g) * g - u0) * sc
        dr.line([(x, 0), (x, Hh)], fill=(48, 48, 54))
    for gv in [v0 + i * g for i in range(int((v1 - v0) / g) + 2)]:
        y = Hh - pad - (math.floor(gv / g) * g - v0) * sc
        dr.line([(0, y), (W, y)], fill=(48, 48, 54))
    for s in segs:
        h = (s[4] * 0.61803398875) % 1.0
        c = tuple(int(255 * x) for x in colorsys.hsv_to_rgb(h, 0.7, 1.0))
        dr.line([(pad + (s[0] - u0) * sc, Hh - pad - (s[1] - v0) * sc), (pad + (s[2] - u0) * sc, Hh - pad - (s[3] - v0) * sc)], fill=c, width=2)
    dr.text((8, 8), f"{d['obj']}  {d['plane']}={d['value']}   horizontal={ax[0]} vertical={ax[1]}   grid 5 cm   "
                    f"u[{u0:.3f},{u1:.3f}] v[{v0:.3f},{v1:.3f}]", fill=(255, 230, 120), font=f)
    im.save(out); print(out); sys.exit(0)

import bpy, bmesh
argv = sys.argv[sys.argv.index('--') + 1:]
prefix = argv[0]; names = argv[1]
objs = [o for o in bpy.data.objects if o.type == 'MESH' and (names == '*' or o.name in names.split(','))
        and not o.name.startswith('_')]
AX = {'x': (0, ('y', 'z'), (1, 2)), 'y': (1, ('x', 'z'), (0, 2)), 'z': (2, ('x', 'y'), (0, 1))}
for spec in argv[2:]:
    pl, val = spec.split('='); val = float(val)
    ai, axes, (iu, iv) = AX[pl]
    segs = []
    for o in objs:
        me = o.data; M = o.matrix_world
        bm = bmesh.new(); bm.from_mesh(me); bm.verts.ensure_lookup_table()
        # island label per vertex
        lab = [-1] * len(bm.verts); k = 0
        for v in bm.verts:
            if lab[v.index] >= 0:
                continue
            st = [v]; lab[v.index] = k
            while st:
                a = st.pop()
                for e in a.link_edges:
                    b = e.other_vert(a)
                    if lab[b.index] < 0:
                        lab[b.index] = k; st.append(b)
            k += 1
        W = [M @ v.co for v in bm.verts]
        for f in bm.faces:
            pts = [W[v.index] for v in f.verts]; ds = [p[ai] - val for p in pts]
            cut = []
            n = len(pts)
            for i in range(n):
                a, b = pts[i], pts[(i + 1) % n]; da, db = ds[i], ds[(i + 1) % n]
                if (da < 0) != (db < 0):
                    t = da / (da - db); p = a.lerp(b, t); cut.append(p)
            if len(cut) >= 2:
                segs.append([round(cut[0][iu], 5), round(cut[0][iv], 5), round(cut[1][iu], 5), round(cut[1][iv], 5),
                             lab[f.verts[0].index] + 17 * objs.index(o)])
        bm.free()
    path = f'{prefix}_{pl}{val:+.3f}.json'
    with open(path, 'w') as fh:
        json.dump(dict(obj=','.join(o.name for o in objs), plane=pl, value=val, axes=axes, segs=segs), fh)
    print('section', path, len(segs))
