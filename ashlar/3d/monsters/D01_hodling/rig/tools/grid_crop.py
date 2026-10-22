"""Cat vung anh render truc giao va ve luoi toa do (met) de doc landmark. python -I grid_crop.py <view> <h0 h1 v0 v1 (the gioi)> <out> [step]
view front: ngang = x, doc = z ; side: ngang = -y (phai anh = phia truoc), doc = z ; back: ngang = -x."""
import json, sys, os
from PIL import Image, ImageDraw
W=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","_work")
def run(view,h0,h1,v0,v1,out,step=0.02,prefix="raw",scale=1600/0.75, src=None):
    proj={p["view"]:p for p in json.load(open(os.path.join(W,prefix+"_proj.json")))}[view]
    img=Image.open(src or os.path.join(W,f"{prefix}_{view}.png")).convert("RGB")
    res=proj["res"]; s=res/proj["ortho_scale"]; c=proj["center"]
    # axis mapping per view
    sign={"front":1,"side":-1,"back":-1}[view]; hc={"front":c[0],"side":c[1],"back":c[0]}[view]
    def px(h): return res/2+sign*(h-hc)*s
    def py(z): return res/2-(z-c[2])*s
    xs=sorted([px(h0),px(h1)]); ys=sorted([py(v0),py(v1)])
    crop=img.crop((int(xs[0]),int(ys[0]),int(xs[1]),int(ys[1])))
    zoom=max(1,int(1100/crop.width)); crop=crop.resize((crop.width*zoom,crop.height*zoom),Image.LANCZOS)
    d=ImageDraw.Draw(crop)
    def gx(h): return (px(h)-xs[0])*zoom
    def gy(z): return (py(z)-ys[0])*zoom
    n=int(round(h0/step))-1
    while n*step<=h1+1e-9:
        h=n*step
        if h0-1e-9<=h<=h1+1e-9:
            X=gx(h); d.line([(X,0),(X,crop.height)],fill=(255,255,0) if abs(h)<1e-9 else (255,255,255),width=1)
            d.text((X+2,2),f"{h:.2f}",fill=(255,255,0))
        n+=1
    n=int(round(v0/step))-1
    while n*step<=v1+1e-9:
        z=n*step
        if v0-1e-9<=z<=v1+1e-9:
            Y=gy(z); d.line([(0,Y),(crop.width,Y)],fill=(255,255,255),width=1); d.text((2,Y+1),f"{z:.2f}",fill=(0,255,255))
        n+=1
    crop.save(out)
if __name__=="__main__":
    a=sys.argv
    run(a[1],*map(float,a[2:6]),a[6],float(a[7]) if len(a)>7 else 0.02)
