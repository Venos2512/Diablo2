"""Stage 0 (skill: kiem tra): intake at real height + island diagnostics. Read-only on the GLB.

blender -b --factory-startup -P s0_intake.py -- <asset_id> <height_m>

Writes  tmp/rig_v1/<asset_id>/s0_intake.blend, s0_islands.json, s0_isl_<view>.png (+ _labels.json)
Appends rig/rig.log of the asset.
"""
import bpy, sys, os, json
from bpy_extras.object_utils import world_to_camera_view

TOOLS = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, TOOLS)
import rigbatch as rb

ROOT = os.path.abspath(os.path.join(TOOLS, '..', '..', '..', '..', '..', '..'))      # repo root
argv = sys.argv[sys.argv.index('--') + 1:]
AID, HM = argv[0], float(argv[1])
SRC = argv[2] if len(argv) > 2 else AID          # regression: read another asset's GLB, write to tmp/rig_v1/<AID>
ADIR = os.path.join(ROOT, 'ashlar', '3d', 'act-01', 'monsters', SRC)
GLB = os.path.join(ADIR, SRC + '.glb')
WORK = os.path.join(ROOT, 'tmp', 'rig_v1', AID)
os.makedirs(WORK, exist_ok=True)

k = HM / rb.REF_H
rc = rb.load_skill(k)
ob, info = rb.intake(GLB, AID, HM)
ok, fr, bk = rb.facing_check(ob)
info['facing_minus_y'] = ok; info['toe_front'] = fr; info['heel_back'] = bk; info['k'] = k
print('facing -Y:', ok, fr, bk)
sym = rc.symmetry_report(ob)
info['symmetry'] = {n: [round(c, 4), round(e, 4)] for n, (c, e) in sym.items()}
lab, isl, rows = rb.island_rows(ob)
rows.sort(key=lambda r: -r['n'])
info['islands'] = rows
with open(os.path.join(WORK, 's0_islands.json'), 'w') as f:
    json.dump(info, f, indent=1)

# island colours by rank, labels at the island centre per view
rank = {r['id']: j for j, r in enumerate(rows)}
cols = [rb.golden_color(rank[lab[i]]) for i in range(len(ob.data.vertices))]
rb.set_point_colors(ob, cols)
scn = bpy.context.scene
cam = rb.setup_render(1000)
lo, hi = rb.frame_box([ob])
for v in ('front', 'back', 'left', 'three_quarter'):
    rb.place_camera(cam, lo, hi, v)
    rb.shading('VERTEX')
    bpy.context.view_layer.update()
    rb.render_to(os.path.join(WORK, f's0_isl_{v}.png'))
    labels = []
    for r in rows:
        if r['n'] < 8:
            continue
        p = world_to_camera_view(scn, cam, rb.Vector(r['c']))
        labels.append(dict(id=r['id'], rank=rank[r['id']], n=r['n'], u=round(p.x, 4), v=round(p.y, 4)))
    with open(os.path.join(WORK, f's0_isl_{v}_labels.json'), 'w') as f:
        json.dump(labels, f)
rb.clear_point_colors(ob)
rb.save(os.path.join(WORK, 's0_intake.blend'))
rb.append_log(os.path.join(ADIR, 'rig', 'rig.log') if SRC == AID else os.path.join(WORK, 'rig_out', 'rig.log'),
              f"s0 intake  {AID}: GLB sha256 {info['sha256']}, glb height {info['glb_height']:.4f} -> {HM} m "
              f"(scale {info['scale']:.5f}, k {k:.4f}); {info['verts']} verts after importer weld, {len(rows)} islands; "
              f"facing -Y {ok}; symmetry {info['symmetry']}")
print('S0_DONE')
