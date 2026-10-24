import sys,numpy as np,bpy
sys.path.insert(0,'tools')
import d01_common as C, d01_measure as M, d01_poses as P, d01_rigkit as K
a=C.script_args(); blend=a[0]
bpy.ops.wm.open_mainfile(filepath=blend)
cx=M.Ctx(); K.reset_pose(K.control()); base=K.eval_mesh_positions()
Wd=np.zeros((cx.nw,cx.W.shape[1])); Wd[cx.inv]=cx.W
dom=np.array(cx.names)[Wd.argmax(1)]
for nm in a[1].split(','):
    P.apply(nm); pos=K.eval_mesh_positions()
    Pb,Pp=cx.welded(base),cx.welded(pos); e=cx.E
    L0=np.linalg.norm(Pb[e[:,0]]-Pb[e[:,1]],axis=1); L1=np.linalg.norm(Pp[e[:,0]]-Pp[e[:,1]],axis=1)
    g=L1-L0; top=np.argsort(-g)[:5]
    print(nm)
    for i in top:
        u,v=e[i]; print('  ',round(g[i]*1000,1),round(L0[i]*1000,1),cx.cls_w[u],dom[u],cx.cls_w[v],dom[v],np.round(Pb[u],3))
