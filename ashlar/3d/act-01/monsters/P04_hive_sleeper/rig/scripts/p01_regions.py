"""P04 Hive-Sleeper: texture-colour regions + extra views (headless Blender 5.1, read-only on the GLB).

blender -b --factory-startup -P p01_regions.py -- <glb> <probe_dir>

Classes from the base colour at each vertex (design palette: linen #D9D0BC, domes #8E9C8A, ribbons #B3262A,
skin #B89A84, hair dark brown, under-layer #6E6A4E). Writes <probe_dir>/vclass.npy and renders.
"""
import bpy, sys, os, json, colorsys
import numpy as np

TOOLS = r'D:/Claude/Diablo2/ashlar/3d/act-01/_batches/rig_v1/tools'
sys.path.insert(0, TOOLS)
import rigbatch as rb

argv = sys.argv[sys.argv.index('--') + 1:]
GLB, OUT = argv[0], argv[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
rb.prefs()
bpy.ops.import_scene.gltf(filepath=GLB, merge_vertices=True)
ob = [o for o in bpy.data.objects if o.type == 'MESH'][0]
M = ob.matrix_world.copy(); ob.parent = None; ob.data.transform(M); ob.matrix_world.identity()
for o in [o for o in bpy.data.objects if o.type != 'MESH']:
    bpy.data.objects.remove(o)
srgb = np.load(os.path.join(OUT, 'vcol_srgb.npy')); lab = np.load(os.path.join(OUT, 'island_rank.npy'))
V = np.array([v.co[:] for v in ob.data.vertices])
assert len(V) == len(srgb)
hsv = np.array([colorsys.rgb_to_hsv(*c) for c in srgb])
h = hsv[:, 0] * 360; s = hsv[:, 1]; v = hsv[:, 2]
r, g, b = srgb[:, 0], srgb[:, 1], srgb[:, 2]

CLS = ['linen', 'dome', 'ribbon', 'skin', 'hair', 'dark']
COL = {'linen': (0.85, 0.80, 0.55), 'dome': (0.25, 0.85, 0.45), 'ribbon': (0.95, 0.10, 0.12), 'skin': (0.95, 0.55, 0.45),
       'hair': (0.35, 0.20, 0.65), 'dark': (0.15, 0.15, 0.18)}
cls = np.full(len(V), 'linen', dtype=object)
red = ((h < 16) | (h > 340)) & (s > 0.50)
greenish = (g >= r - 0.01) | ((h > 55) & (h < 200))          # domes: grey-green, g >= r
dark = v < 0.16
cls[greenish] = 'dome'
cls[red] = 'ribbon'
skin_isl = np.isin(lab, [1, 2, 3])                           # legs+belly, arms
cls[skin_isl & ~red] = 'skin'
cls[dark & ~red & ~skin_isl] = 'dark'
np.save(os.path.join(OUT, 'vclass.npy'), np.array([CLS.index(c) for c in cls]))
stats = {}
for c in CLS:
    m = cls == c
    if m.any():
        stats[c] = dict(n=int(m.sum()), lo=V[m].min(0).round(3).tolist(), hi=V[m].max(0).round(3).tolist())
print(json.dumps(stats, indent=1))
# hue/sat/val histogram of the big island (for tuning)
big = lab == 0
hist = {}
for hb in range(0, 360, 20):
    m = big & (h >= hb) & (h < hb + 20)
    hist[hb] = [int(m.sum()), round(float(s[m].mean()) if m.any() else 0, 2), round(float(v[m].mean()) if m.any() else 0, 2),
                round(float((g[m] - r[m]).mean()) if m.any() else 0, 3)]
print('big-island hue bins [n, mean sat, mean val, mean g-r]:', hist)
json.dump(dict(stats=stats, hist=hist), open(os.path.join(OUT, 'regions.json'), 'w'), indent=1)

rb.set_point_colors(ob, [COL[c] for c in cls], 'cls')
cam = rb.setup_render(1024)
lo, hi = rb.frame_box([ob])
rb.VIEW_DIRS['bottom'] = (0, 0.0001, -1)
rb.VIEW_DIRS['back_low'] = (0.35, 1, -0.25)
rb.VIEW_DIRS['front_low'] = (-0.35, -1, -0.2)
for vw in ('left', 'front', 'top', 'back', 'bottom'):
    rb.place_camera(cam, lo, hi, vw)
    rb.only_visible([ob]); rb.shading('VERTEX', xray=False)
    rb.render_to(os.path.join(OUT, f'cls_{vw}.png'))
for vw in ('bottom', 'back_low', 'front_low'):
    rb.place_camera(cam, lo, hi, vw)
    rb.only_visible([ob]); rb.shading('TEXTURE')
    rb.render_to(os.path.join(OUT, f'tex_{vw}.png'))
# head close-up, side and front
for vw, c in (('left', (0.0, -0.40, 0.42)), ('front', (0.0, -0.40, 0.40))):
    rb.render_closeup(os.path.join(OUT, f'head_{vw}.png'), [ob], c, 0.30, view=vw, color_type='TEXTURE', res=900)
rb.render_closeup(os.path.join(OUT, 'head_left_xray.png'), [ob], (0.0, -0.40, 0.42), 0.30, view='left', color_type='VERTEX',
                  res=900, xray=True, alpha=0.5)
print('REGIONS_DONE')
