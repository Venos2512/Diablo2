"""Chan doan: ty le gian canh (edge) theo tu the cuc tri. blender -b -P t4_stretch.py"""
import os, sys
import bpy, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import d01_common as C, d01_rigkit as K, d01_poses as P, d01_skin as S
bpy.ops.wm.open_mainfile(filepath=C.BLEND)
me=K.get_mesh().data
n=len(me.vertices)
rest=K.rest_positions()
inv,first=S.weld(rest)
me.calc_loop_triangles()
tris=np.empty(len(me.loop_triangles)*3,dtype=np.int64); me.loop_triangles.foreach_get("vertices",tris); tris=tris.reshape(-1,3)
E=S.adjacency(inv[tris],inv.max()+1)
Pw=np.zeros((inv.max()+1,3)); Pw[inv]=rest
L0=np.linalg.norm(Pw[E[:,0]]-Pw[E[:,1]],axis=1)
# danh dau vung / bone troi nhat tai dinh de bao cao
vgs=[g.name for g in K.get_mesh().vertex_groups]
Wd=np.zeros((n,len(vgs)))
for v in me.vertices:
    for g in v.groups: Wd[v.index,g.group]=g.weight
dom=np.array(vgs)[Wd.argmax(1)]
domw=np.zeros(inv.max()+1,dtype=object); domw[inv]=dom
for nm in P.POSES:
    P.apply(nm)
    ev=K.eval_mesh_positions()
    Pe=np.zeros((inv.max()+1,3)); Pe[inv]=ev
    L1=np.linalg.norm(Pe[E[:,0]]-Pe[E[:,1]],axis=1)
    ok=L0>1e-5
    r=L1[ok]/L0[ok]
    dl=(L1-L0)
    k=np.argsort(-dl[ok])[:3]
    idx=np.nonzero(ok)[0][k]
    print(f"{nm:16s} max ratio {r.max():5.2f} max abs growth {dl.max()*1000:5.1f} mm  min {r.min():4.2f}  worst:", [(round(float(L1[i]/L0[i]),2), round(float(dl[i]*1000),1), round(float(L0[i]*1000),1), domw[E[i,0]], domw[E[i,1]], np.round(Pw[E[i,0]],3).tolist()) for i in idx[:2]])
