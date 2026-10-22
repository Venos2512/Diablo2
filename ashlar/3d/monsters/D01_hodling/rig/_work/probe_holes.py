import sys,numpy as np,bpy
sys.path.insert(0,'tools')
import d01_common as C, d01_measure as M
bpy.ops.wm.open_mainfile(filepath=C.BLEND)
cx=M.Ctx()
t=cx.inv[cx.tris[cx.body_tri]]
e=np.concatenate([t[:,[0,1]],t[:,[1,2]],t[:,[2,0]]]); e=np.sort(e,axis=1)
u,c=np.unique(e,axis=0,return_counts=True)
b=u[c==1]
P=cx.welded(cx.rest)
pts=np.unique(b.ravel())
print(len(b),'boundary edges', len(pts),'verts')
for v in pts: print(np.round(P[v],3), cx.cls_w[v])
# distance to flap verts
fl=cx.rest[cx.idx('flap_front')]
d=np.array([np.linalg.norm(fl-P[v],axis=1).min() for v in pts]); print('min dist hole->flap mm',d.min()*1000)
