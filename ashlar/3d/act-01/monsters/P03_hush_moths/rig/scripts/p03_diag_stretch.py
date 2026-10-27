"""P03 diagnostics: worst stretched edges per pose (position, length change, dominant bones).
blender -b --factory-startup -P p03_diag_stretch.py -- <pose,pose,...> [top]
"""
import bpy, sys, os, json
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import p03_common as pc  # noqa: E402
import p03_qa as qa  # noqa: E402

argv = sys.argv[sys.argv.index('--') + 1:]
poses = argv[0].split(','); top = int(argv[1]) if len(argv) > 1 else 8
bpy.ops.wm.open_mainfile(filepath=pc.ADIR + '/rig/P03_hush_moths_rig.blend')
ob = bpy.data.objects['P03_hush_moths']; ctl = bpy.data.objects['P03_hush_moths_ctl']; me = ob.data
gn = [g.name for g in ob.vertex_groups]
P0 = np.array([v.co[:] for v in me.vertices])


def wtxt(i):
    w = sorted(((g.weight, gn[g.group]) for g in me.vertices[i].groups), reverse=True)
    return ' '.join(f'{n}:{x:.2f}' for x, n in w)


for name in poses:
    spec = qa.POSES[name] if name in qa.POSES else json.loads(name)
    qa.apply(ctl, spec); P = qa.positions(ob)
    st, qq, E = qa.edge_stretch(me, P0, P, 0.004 * 0.33)
    order = np.argsort(-qq)[:top]
    print(f'== {name}: worst {st}')
    for k in order:
        a, b = E[k]
        r = np.linalg.norm(P0[a] - P0[b]); d = np.linalg.norm(P[a] - P[b])
        print(f'  q {qq[k]:.2f} len {r*1000:.1f}->{d*1000:.1f}mm at {np.round(P0[a],3)} | {wtxt(a)} || {wtxt(b)}')
qa.clear(ctl)
