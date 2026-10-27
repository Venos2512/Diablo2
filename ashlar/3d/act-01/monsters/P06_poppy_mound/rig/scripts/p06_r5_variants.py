# R5 extra: numeric variants of the death collapse and of a sleeper stir (no renders). blender -b --factory-startup -P p06_r5_variants.py
import bpy, os, sys, json, math
sys.dont_write_bytecode = True
sys.path.insert(0, r'D:/Claude/Diablo2/ashlar/3d/act-01/monsters/P06_poppy_mound/rig/scripts')
import p06_common as C
import numpy as np
bpy.ops.wm.open_mainfile(filepath=C.BLEND)
rig = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
ob = next(o for o in bpy.data.objects if o.type == 'MESH')
me = ob.data; cls = C.classify(ob); vis = np.array(cls['vis'])
BASE = np.array([v.co[:] for v in me.vertices]); E = np.array([e.vertices[:] for e in me.edges])
RL = np.linalg.norm(BASE[E[:,0]]-BASE[E[:,1]],axis=1); ok = RL >= 0.01
F = ('flank_front','L_flank','R_flank','flank_back')
def run(name, spec):
    for pb in rig.pose.bones:
        pb.location=(0,0,0); pb.rotation_euler=(0,0,0)
    for n,d in spec.items():
        pb=rig.pose.bones[n]
        if 'loc' in d: pb.location=d['loc']
        if 'rot' in d: pb.rotation_euler=[math.radians(a) for a in d['rot']]
    bpy.context.view_layer.update()
    dg=bpy.context.evaluated_depsgraph_get(); m=ob.evaluated_get(dg).to_mesh(); A=np.array([v.co[:] for v in m.vertices]); ob.evaluated_get(dg).to_mesh_clear()
    ln=np.linalg.norm(A[E[:,0]]-A[E[:,1]],axis=1); q=ln[ok]/RL[ok]; q=np.maximum(q,1/q)
    b = ok & (vis[E[:,0]]==0); qb=ln[b]/RL[b]; qb=np.maximum(qb,1/qb)
    print('VAR %-34s body_worst %.2f  body>1.6 %4d  all>1.6 %4d  p99 %.3f  zmin %.3f' % (name, qb.max(), np.count_nonzero(qb>1.6), np.count_nonzero(q>1.6), np.percentile(q,99), A[:,2].min()))
for cd in (0.25, 0.40):
    run(f'crown -{cd} only', {'crown': dict(loc=(0,-cd,0))})
    run(f'crown -{cd} + flanks out .08', {'crown': dict(loc=(0,-cd,0)), **{f: dict(loc=(0,0.08,0)) for f in F}})
    run(f'crown -{cd} + flanks out .12 sag .10', {'crown': dict(loc=(0,-cd,0)), **{f: dict(loc=(0,0.12,-0.10)) for f in F}})
    run(f'crown -{cd} + flanks sag .10', {'crown': dict(loc=(0,-cd,0)), **{f: dict(loc=(0,0,-0.10)) for f in F}})
    run(f'crown -{cd} + body -0.05', {'crown': dict(loc=(0,-cd,0)), 'body': dict(loc=(0,-0.05,0))})
for a in (5, 8):
    run(f'stir flank_front rot X {a}', {'flank_front': dict(rot=(a,0,0))})
    run(f'stir flank_front rot Z {a}', {'flank_front': dict(rot=(0,0,a))})
    run(f'stir flank_front loc X {a/100:.2f}', {'flank_front': dict(loc=(a/100,0,0))})
