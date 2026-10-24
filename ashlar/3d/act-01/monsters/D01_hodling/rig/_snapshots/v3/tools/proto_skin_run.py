"""Chay skin (python thuong) -> _work/skin_proto.npz (W theo dinh goc 6505)."""
import sys, os, time
import numpy as np
HERE=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,HERE)
import d01_skin as S, d01_common as C
d=np.load(os.path.join(C.WORK,"mesh_scaled.npz"))
t=time.time()
r=S.compute(d["co"],d["col"],d["tris"])
Wn=r["W"][r["inv"]]  # theo dinh goc
import time
for _try in range(15):  # Windows: file vua doc/ghi co the bi khoa tam thoi
    try:
        np.savez_compressed(os.path.join(C.WORK,"skin_proto.npz"),W=Wn,names=np.array(r["names"]),cls=r["cls"][r["inv"]].astype(str))
        break
    except OSError:
        time.sleep(1.0)
else:
    raise
import collections
print("time",round(time.time()-t,2),collections.Counter(r["cls"]))
print("max influences",(Wn>0).sum(1).max(),"sum err",abs(Wn.sum(1)-1).max())
