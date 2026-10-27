"""P03 R1: close-up renders of the legs (texture + X-ray) with the profile centroids, for placing the leg joints.

blender -b --factory-startup -P p03_r1_closeups.py -- <out_dir> [height_m]
Marker colours: centroid bins blue -> red along the leg (root -> tip); radius peaks are bigger yellow balls.
"""
import bpy, sys, os, json, colorsys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import p03_common as pc  # noqa: E402
rb = pc.rb

argv = sys.argv[sys.argv.index('--') + 1:]
OUT = argv[0]; H = float(argv[1]) if len(argv) > 1 else pc.HEIGHT_DEFAULT
os.makedirs(OUT, exist_ok=True)
M = pc.Moth(H)

pts = []; dump = {}
for name in sorted(M.legs):
    lp = M.leg_profile(name)
    prof = lp['prof']; rad = np.array([p['rad'] for p in prof])
    rs = np.convolve(rad, [1 / 3, 1 / 3, 1 / 3], mode='same')
    peaks = [k for k in range(1, len(prof) - 1) if rs[k] >= rs[k - 1] and rs[k] >= rs[k + 1]]
    for k, p in enumerate(prof):
        t = k / max(1, len(prof) - 1)
        pts.append((tuple(p['c']), colorsys.hsv_to_rgb(0.66 * (1 - t), 0.9, 0.9)))
    dump[name] = dict(length=round(lp['length'], 4), root=pc.r4(M.CO[lp['root']]), tip=pc.r4(M.CO[lp['tip']]),
                      bins=[dict(k=k, s=round(p['s'], 4), c=pc.r4(p['c']), rad=round(p['rad'], 4), rs=round(float(rs[k]), 4),
                                 inside=M.inside_body(p['c'])) for k, p in enumerate(prof)],
                      peaks=peaks)
with open(os.path.join(OUT, 'leg_profiles.json'), 'w') as f:
    json.dump(dump, f, indent=1)
mk = pc.marker_object('_marks', pts, radius=0.0028)
peak_pts = []
for name, d in dump.items():
    for k in d['peaks']:
        peak_pts.append((tuple(d['bins'][k]['c']), (1.0, 0.9, 0.1)))
pk = pc.marker_object('_peaks', peak_pts, radius=0.0055)

legL = [M.isl[M.legs[n]] for n in M.legs if n.startswith('L_')]
cols = M.role_colors(); rb.set_point_colors(M.ob, cols)
ob = M.ob
cam = rb.setup_render(1024)
jobs = [('legs_left', 'left', (0, 0.0, 0.12), 0.56), ('legs_front', 'front', (0.13, 0, 0.11), 0.36),
        ('legs_top', 'topdown', (0.0, 0.0, 0.1), 0.6), ('body_left', 'left', (0, 0.03, 0.22), 0.5)]
for tag, view, ctr, size in jobs:
    for xray, ct in ((False, 'TEXTURE'), (True, 'VERTEX')):
        c = pc.Vector(ctr); lo = c - pc.Vector((size, size, size)) / 2; hi = c + pc.Vector((size, size, size)) / 2
        rb.place_camera(cam, lo, hi, view, center=c, size=size)
        rb.only_visible([ob, mk, pk]); rb.shading(ct, xray=xray, alpha=0.35)
        if ct == 'TEXTURE':
            rb.only_visible([ob])
        rb.render_to(os.path.join(OUT, f'{tag}_{"xray" if xray else "tex"}.png'))
print('CLOSEUPS_DONE')
