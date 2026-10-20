import json,struct,numpy as np,sys
def load(f):
    b=open(f,'rb').read(); n=struct.unpack('<I',b[12:16])[0]; j=json.loads(b[20:20+n]); bin_=b[20+n+8:]
    def acc(i):
        a=j['accessors'][i]; bv=j['bufferViews'][a['bufferView']]; o=bv.get('byteOffset',0)+a.get('byteOffset',0)
        c={'VEC2':2,'VEC3':3,'SCALAR':1}[a['type']]; dt={5126:np.float32,5125:np.uint32,5123:np.uint16}[a['componentType']]
        x=np.frombuffer(bin_,dt,a['count']*c,o); return x.reshape(-1,c) if c>1 else x
    return j,acc
src,kit=sys.argv[1],sys.argv[2]
j,acc=load(src); p=j['meshes'][0]['primitives'][0]
S=acc(p['attributes']['TEXCOORD_0']); SP=acc(p['attributes']['POSITION'])
key=lambda u:set(map(tuple,np.round(u,4)))
ss=key(S)
j2,acc2=load(kit)
for m in j2['meshes']:
    pr=m['primitives'][0]; U=acc2(pr['attributes']['TEXCOORD_0'])
    k=np.round(U,4); hit=np.mean([tuple(x) in ss for x in k])
    k2=np.round(np.c_[U[:,0],1-U[:,1]],4); hit2=np.mean([tuple(x) in ss for x in k2])
    print(m['name'], len(U), 'match', round(hit,3), 'flipped-match', round(hit2,3))
# pair each kit vertex to the source vertex with the same UV, then check positions follow one affine map
d={}
for i,x in enumerate(np.round(S,5)): d.setdefault(tuple(x),[]).append(i)
for m in j2['meshes']:
    pr=m['primitives'][0]; U=acc2(pr['attributes']['TEXCOORD_0']); P=acc2(pr['attributes']['POSITION'])
    pairs=[(a,d[tuple(x)][0]) for a,x in enumerate(np.round(U,5)) if tuple(x) in d and len(d[tuple(x)])==1]
    A=np.array([P[a] for a,_ in pairs]); B=np.array([SP[b] for _,b in pairs])
    X=np.c_[B,np.ones(len(B))]; M,res,*_=np.linalg.lstsq(X,A,rcond=None)
    err=np.abs(X@M-A).max(1)
    print(m['name'],'pairs',len(pairs),'median err',np.median(err).round(4),'p95',np.percentile(err,95).round(4), 'size', (A.max(0)-A.min(0)).round(2))
