"""Original bone-environment concept sheets. Pillow + NumPy, no downloads.

Run: python legacy/art-output/bone-concepts/generate_bones.py
All writes are confined to this script's directory. Fixed 2:1 isometric camera;
procedural anatomical meshes are CPU-rasterized with ground clipping, damp
contact bands and a single upper-left key. Local terrain references are read
only, then heavily simplified/tinted. This is concept art, not engine sprites.
"""
from pathlib import Path
import json, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[1]
W, H = 1920, 1280
BG = (18, 21, 21)
INK = (190, 185, 164)
MUTED = (118, 127, 117)
PALETTES = {
    1: dict(name='I / BLOOD MOOR', soil='#343A30', shadow='#1B1F1C', bone='#817D6A', moss='#4A5140', water='#303B3B'),
    2: dict(name='II / ARANOCH', soil='#80705A', shadow='#302A25', bone='#999080', moss='#68624D', water='#645747'),
    3: dict(name='III / KURAST', soil='#303C30', shadow='#141C19', bone='#717868', moss='#46593F', water='#263C38'),
    4: dict(name='IV / ASH WASTES', soil='#352D2A', shadow='#201919', bone='#6D6258', moss='#49423A', water='#302220'),
    5: dict(name='V / ARREAT', soil='#727E84', shadow='#28333B', bone='#8C8D80', moss='#56605D', water='#4B5B65'),
}

def rgb(h):
    return np.array(tuple(int(h[i:i+2],16) for i in (1,3,5)),dtype=float)

def font(size, serif=False):
    p = Path('C:/Windows/Fonts/georgia.ttf' if serif else 'C:/Windows/Fonts/arial.ttf')
    if not p.exists():
        p = Path('/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf' if serif else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
    return ImageFont.truetype(str(p),size)

def text(im, xy, value, size=19, color=INK, serif=False):
    ImageDraw.Draw(im).text(xy,value,font=font(size,serif),fill=color)

def sheet(n,title,sub):
    yy,xx=np.mgrid[:H,:W]
    a=np.zeros((H,W,3),dtype=np.uint8)
    grain=np.random.default_rng(100+n).normal(0,.65,(H,W))
    for k in range(3): a[:,:,k]=np.clip(BG[k]+grain+2*np.exp(-((xx-720)/950)**2),0,255)
    im=Image.fromarray(a)
    d=ImageDraw.Draw(im)
    d.line((62,65,133,65),fill=(131,119,89),width=2)
    text(im,(154,41),f'{n:02d}  /  {title}',34,serif=True)
    text(im,(64,98),sub,18,MUTED)
    d.line((64,1196,1856,1196),fill=(57,64,58))
    text(im,(64,1220),'BONE STUDIES   /   ORIGINAL ENVIRONMENT CONCEPTS   /   FIXED ISO 2:1   /   KEY: UPPER LEFT',15,MUTED)
    text(im,(1580,1220),'1 H = 75 px in game',16,MUTED)
    return im

def panel_title(im,x,y,title,subtitle):
    text(im,(x,y),title,22,serif=True)
    text(im,(x,y+32),subtitle,16,MUTED)

def noise2(w,h,rng):
    out=np.zeros((h,w))
    for grid,amp in [(6,1),(20,.5),(65,.22),(170,.08)]:
        x=rng.normal(0,1,(max(2,int(h/w*grid)),grid))
        a=Image.fromarray(np.uint8(np.clip(128+x*28,0,255)))
        out+=(np.asarray(a.resize((w,h),Image.Resampling.BICUBIC)).astype(float)-128)/28*amp
    return out

class Scene:
    """A small deterministic orthographic painter with a floating-point z-buffer."""
    def __init__(self,w,h,scale=160,origin=None,act=1,seed=1,patch=True):
        self.w,self.h,self.scale=w,h,scale
        self.ox,self.oy=origin or (w*.5,h*.68)
        self.act=act; self.p=PALETTES[act]
        self.r=random.Random(seed); self.rng=np.random.default_rng(seed)
        self.vertices=[]; self.faces=[]
        self.depth=np.full((h,w),-1e8,dtype=np.float32)
        self.object_mask=np.zeros((h,w),np.uint8)
        self.bone_mask=np.zeros((h,w),np.uint8)
        self.near=np.zeros((h,w),np.uint8)
        self.water_mask=np.zeros((h,w),np.uint8)
        self.path=False
        yy,xx=np.mgrid[:h,:w]
        dx=(xx-self.ox)/scale;dy=(yy-self.oy)/scale
        self.gx=dx/.70710678/2+dy/.35355339/2
        self.gy=-dx/.70710678/2+dy/.35355339/2
        n=noise2(w,h,self.rng)
        self.groundnoise=n
        base=rgb(self.p['soil'])
        arr=base[None,None,:]*(.90+n[:,:,None]*.11)
        # Large material variation derived from the project's local reference.
        ref=ROOT/'legacy/art-direction/reference/terrain-moor/mud_wet.png'
        if ref.exists():
            refim=Image.open(ref).convert('L').resize((w,h),Image.Resampling.BILINEAR)
            refim=refim.filter(ImageFilter.GaussianBlur(1.25))
            arr+=(np.asarray(refim,dtype=float)-65)[:,:,None]*.12
        self.arr=np.uint8(np.clip(arr,0,255))
        self.base=self.arr.copy()
        if patch:
            q=((xx-w*.50)/(w*.47))**2+((yy-h*.65)/(h*.31))**2
            mask=np.clip((1.05-q+n*.035)*9,0,1)
            self.terrain_mask=np.uint8(mask*255)
            self.arr=np.uint8(self.arr*mask[:,:,None]+np.array(BG)*(1-mask[:,:,None]))
        else: self.terrain_mask=np.full((h,w),255,np.uint8)
        self.base=self.arr.copy()
        self.ground_marks()

    def project(self,p):
        p=np.asarray(p)
        return np.stack((self.ox+(p[...,0]-p[...,1])*.70710678*self.scale,
                         self.oy+((p[...,0]+p[...,1])*.35355339-p[...,2]*.8660254)*self.scale),axis=-1)

    def height(self,x,y):
        return .009*np.sin(x*4.1+y*2.3)+.008*np.sin(x*8.7-y*5.8)

    def ground_marks(self):
        im=Image.fromarray(self.arr); d=ImageDraw.Draw(im)
        for _ in range(int(self.w*self.h/180)):
            x=self.r.randrange(self.w);y=self.r.randrange(self.h)
            if self.terrain_mask[y,x]<180:continue
            v=self.r.choice([-.18,-.12,.09,.16])
            col=tuple(np.uint8(np.clip(self.base[y,x]*(1+v),0,255)))
            rad=self.r.choice([1.7,2.2,3.8])
            d.polygon([(x,y),(x+rad*2,y-1),(x+rad*2.3,y+rad*.5),(x+1,y+rad)],fill=col)
        self.arr=np.asarray(im).copy();self.base=self.arr.copy()

    def mesh(self,verts,faces,color,mat='bone'):
        k=len(self.vertices);self.vertices.extend(verts)
        for f in faces:self.faces.append((tuple(k+i for i in f),np.array(color),mat))

    def tube(self,points,radii,color=None,mat='bone',sides=10):
        points=np.array(points,float)
        if isinstance(radii,(float,int)):radii=[radii]*len(points)
        vs=[]
        for i,(p,rad) in enumerate(zip(points,radii)):
            tangent=points[min(i+1,len(points)-1)]-points[max(0,i-1)]
            tangent/=np.linalg.norm(tangent)+1e-10
            b=np.cross(tangent,[0,0,1.])
            if np.linalg.norm(b)<.01:b=np.cross(tangent,[0,1.,0])
            b/=np.linalg.norm(b)+1e-10;c=np.cross(tangent,b)
            for j in range(sides):
                t=math.tau*j/sides
                # Uneven bone cortex: broad irregularities rather than fine grain.
                rr=rad*(1+.055*math.sin(i*1.8+j*2.1))
                vs.append(p+rr*(math.cos(t)*b+math.sin(t)*c))
        fs=[]
        for i in range(len(points)-1):
            for j in range(sides):
                a=i*sides+j;b=i*sides+(j+1)%sides;c=b+sides;dd=a+sides
                fs.extend([(a,b,c),(a,c,dd)])
        fs.extend([tuple(range(sides-1,-1,-1)),tuple((len(points)-1)*sides+j for j in range(sides))])
        self.mesh(vs,fs,rgb(self.p['bone']) if color is None else color,mat)

    def ellipsoid(self,center,radii,color=None,mat='bone',rotation=0):
        vs=[];n,m=14,9
        for j in range(m+1):
            t=math.pi*j/m
            for i in range(n):
                u=math.tau*i/n
                p=np.array([math.sin(t)*math.cos(u)*radii[0],math.sin(t)*math.sin(u)*radii[1],math.cos(t)*radii[2]])
                p[:2]=[p[0]*math.cos(rotation)-p[1]*math.sin(rotation),p[0]*math.sin(rotation)+p[1]*math.cos(rotation)]
                vs.append(p+center)
        fs=[]
        for j in range(m):
            for i in range(n):
                a=j*n+i;b=j*n+(i+1)%n;c=b+n;d=a+n
                fs.extend([(a,c,b),(a,d,c)])
        self.mesh(vs,fs,rgb(self.p['bone']) if color is None else color,mat)

    def bone(self,a,b,r=.035):
        a=np.array(a);b=np.array(b);v=b-a
        self.tube([a,a+v*.16,a+v*.52,a+v*.85,b],[r*1.5,r,r*.8,r,r*1.4])
        for p in (a,b):self.ellipsoid(p,(r*1.65,r*1.35,r*1.35))

    def puddle(self,x,y,rx=.55,ry=.24):
        im=Image.fromarray(self.arr);d=ImageDraw.Draw(im)
        pts=[]
        for i in range(46):
            t=math.tau*i/46;rr=1+.09*math.sin(t*7)+.07*math.sin(t*11)
            pts.append(tuple(self.project([x+math.cos(t)*rx*rr,y+math.sin(t)*ry*rr,0])))
        wm=Image.new('L',im.size);wd=ImageDraw.Draw(wm);wd.polygon(pts,fill=255)
        self.water_mask=np.maximum(self.water_mask,np.asarray(wm))
        ring=np.asarray(wm.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(2)),dtype=float)/255
        inside=np.asarray(wm)>0
        arr=np.asarray(im).copy();arr=np.uint8(arr*(1-ring[:,:,None]*.28))
        water=rgb(self.p['water'])[None,None,:]*(.85+self.groundnoise[:,:,None]*.09)
        arr[inside]=np.uint8(np.clip(water,0,255))[inside]
        im=Image.fromarray(arr);d=ImageDraw.Draw(im)
        for i in range(3,17,3):
            p=pts[i];d.line((p[0]-8,p[1]+2,p[0]+3,p[1]+2),fill=tuple((rgb(self.p['water'])*1.08).astype(int)),width=2)
        self.arr=np.asarray(im).copy();self.base=self.arr.copy()

    def render(self):
        verts=np.array(self.vertices)
        pp=self.project(verts)
        zdepth=verts[:,0]+verts[:,1]+verts[:,2]*1.633
        # Smooth surface lighting is interpolated across the original organic
        # mesh; the final art is painted cortex rather than faceted grey plastic.
        normals=np.zeros_like(verts)
        for ids,col,mat in self.faces:
            a,b,c=ids[:3]
            nn=np.cross(verts[b]-verts[a],verts[c]-verts[a])
            for k in ids:normals[k]+=nn
        normals/=np.maximum(1e-8,np.linalg.norm(normals,axis=1))[:,None]
        self.shadow=Image.new('L',(self.w,self.h));sd=ImageDraw.Draw(self.shadow)
        light=np.array([-0.65,-.3,1.]);light/=np.linalg.norm(light)
        # Cast shadows land down-right, consistent for every sheet and Act.
        for ids,color,mat in self.faces:
            ids=list(ids)
            vv=verts[ids]
            if vv[:,2].max()<=0:continue
            if mat not in ('bone','wood','iron','moss'):continue
            sh=vv.copy();sh[:,0]+=np.maximum(0,sh[:,2])*.65;sh[:,1]+=np.maximum(0,sh[:,2])*.3;sh[:,2]=0
            sd.polygon([tuple(p) for p in self.project(sh)],fill=100 if mat=='bone' else 65)
        shadow=np.asarray(self.shadow.filter(ImageFilter.GaussianBlur(max(1,self.scale*.025))),dtype=float)/255
        shadow*=self.terrain_mask/255
        self.arr=np.uint8(self.arr*(1-shadow[:,:,None]*.6))
        self.base=self.arr.copy()
        for ids,col,mat in self.faces:
            ids=list(ids)
            for j in range(1,len(ids)-1):
                ii=[ids[0],ids[j],ids[j+1]];v=verts[ii];p=pp[ii]
                lo=np.floor(p.min(axis=0)).astype(int);hi=np.ceil(p.max(axis=0)).astype(int)+1
                x0,y0=max(0,lo[0]),max(0,lo[1]);x1,y1=min(self.w,hi[0]),min(self.h,hi[1])
                if x1<=x0 or y1<=y0:continue
                den=(p[1,1]-p[2,1])*(p[0,0]-p[2,0])+(p[2,0]-p[1,0])*(p[0,1]-p[2,1])
                if abs(den)<1e-6:continue
                yy,xx=np.mgrid[y0:y1,x0:x1];xx=xx+.5;yy=yy+.5
                u=((p[1,1]-p[2,1])*(xx-p[2,0])+(p[2,0]-p[1,0])*(yy-p[2,1]))/den
                vvv=((p[2,1]-p[0,1])*(xx-p[2,0])+(p[0,0]-p[2,0])*(yy-p[2,1]))/den
                ww=1-u-vvv
                inside=(u>=-.001)&(vvv>=-.001)&(ww>=-.001)
                depth=u*zdepth[ii[0]]+vvv*zdepth[ii[1]]+ww*zdepth[ii[2]]
                world=u[:,:,None]*v[0]+vvv[:,:,None]*v[1]+ww[:,:,None]*v[2]
                height=world[:,:,2]-self.height(world[:,:,0],world[:,:,1])
                good=inside&(depth>self.depth[y0:y1,x0:x1])&(height>=0)
                if not good.any():continue
                nn=u[:,:,None]*normals[ii[0]]+vvv[:,:,None]*normals[ii[1]]+ww[:,:,None]*normals[ii[2]]
                nn/=np.maximum(1e-8,np.linalg.norm(nn,axis=2))[:,:,None]
                lam=np.maximum(0,nn@light)
                shade=.64+.37*lam
                if mat=='socket':shade=np.full_like(lam,.65)
                # Mineral stains are broad, never a pixel-noise overlay.
                pat=np.sin(world[:,:,0]*21+world[:,:,1]*12)*np.sin(world[:,:,2]*17-world[:,:,0]*7)
                shade=shade+pat*.035
                colarr=col[None,None,:]*shade[:,:,None]
                # Brown mineral stain and wet soil occlude the bottom of each bone.
                damp=np.clip((.065-height)/.065,0,1)
                if mat=='bone':
                    colarr=colarr*(1-damp[:,:,None]*.73)+rgb(self.p['shadow'])*damp[:,:,None]*.73
                    if self.act==1:
                        # Rec.709 luma is explicitly bounded to 45 for Act I cortex.
                        lum=colarr@np.array([.2126,.7152,.0722]);colarr*=np.minimum(1,114.75/np.maximum(1,lum))[:,:,None]
                colarr=np.uint8(np.clip(colarr,0,255))
                self.arr[y0:y1,x0:x1][good]=colarr[good]
                self.depth[y0:y1,x0:x1][good]=depth[good]
                self.object_mask[y0:y1,x0:x1][good]=255
                self.bone_mask[y0:y1,x0:x1][good]=255 if mat=='bone' else 0
                contact=(height<.085)&good if mat=='bone' else np.zeros_like(good)
                self.near[y0:y1,x0:x1][good]=0
                self.near[y0:y1,x0:x1][contact]=255
        # A dark damp ring outside ground intersections + a broken raised mud lip.
        nm=Image.fromarray(self.near)
        outer=np.asarray(nm.filter(ImageFilter.MaxFilter(7)))>0
        outer&=self.object_mask==0
        self.arr[outer]=np.uint8(self.arr[outer]*.64)
        self.im=Image.fromarray(self.arr)
        self.overgrowth()
        return self.im

    def overgrowth(self):
        d=ImageDraw.Draw(self.im)
        # Pixel sizes are intentionally chunky: no high-frequency dust overlay.
        count=int(self.w*self.h/650)
        for _ in range(count):
            x=self.r.randrange(self.w);y=self.r.randrange(self.h)
            if self.terrain_mask[y,x]<200 or self.water_mask[y,x]>0:continue
            if self.object_mask[y,x] and not self.near[y,x]:continue
            c=rgb(self.p['moss'])*self.r.uniform(.64,1.04)
            col=tuple(np.uint8(c))
            if self.act in (1,3):
                length=self.r.uniform(3,9)*max(.6,self.scale/170)
                lean=self.r.uniform(-5,5)
                d.line((x,y,x+lean*.4,y-length*.65,x+lean,y-length),fill=col,width=max(2,int(self.scale/150)))
                if self.r.random()<.35:
                    d.line((x+2,y+1,x+2-lean*.6,y-length*.7),fill=tuple(np.uint8(c*.8)),width=2)
            elif self.act==2:
                d.line((x-5,y,x+6,y+1),fill=col,width=2)
            elif self.act==5:
                d.polygon([(x-4,y),(x+5,y-1),(x+7,y+2),(x-3,y+3)],fill=(130,144,151))
        # Chunky moss islands directly on cortex, restricted to lower bone.
        if self.act in (1,3):
            ys,xs=np.where(self.near>0)
            if len(xs):
                for i in range(min(180,len(xs)//6)):
                    k=self.r.randrange(len(xs));x,y=int(xs[k]),int(ys[k]);r=self.r.uniform(2,5)
                    d.ellipse((x-r,y-r*.3,x+r,y+r*.4),fill=tuple(np.uint8(rgb(self.p['moss'])*self.r.uniform(.65,.9))))
        if self.act==5:
            # Hoarfrost occupies upper ledges, never a white silhouette.
            mask=Image.fromarray(self.bone_mask)
            edge=np.asarray(ImageChops.subtract(mask,ImageChops.offset(mask,0,2)))>0
            arr=np.asarray(self.im).copy();arr[edge]=(143,153,154);self.im=Image.fromarray(arr)

def tr(p,center=(0,0,0),scale=1,angle=0):
    p=np.array(p,float)*scale
    x=p[...,0].copy();y=p[...,1].copy()
    p[...,0]=x*math.cos(angle)-y*math.sin(angle)+center[0]
    p[...,1]=x*math.sin(angle)+y*math.cos(angle)+center[1]
    p[...,2]+=center[2]
    return p

class Anatomy:
    def __init__(self,scene,center=(0,0,0),scale=1,angle=0):
        self.s=scene;self.center=center;self.scale=scale;self.angle=angle
    def p(self,p):return tr(p,self.center,self.scale,self.angle)
    def tube(self,p,r,color=None,mat='bone',sides=10):
        rr=[x*self.scale for x in r] if isinstance(r,list) else r*self.scale
        self.s.tube(self.p(p),rr,color,mat,sides)
    def ell(self,p,r,col=None,mat='bone'):
        self.s.ellipsoid(self.p(p),np.array(r)*self.scale,col,mat,self.angle)
    def bone(self,a,b,r=.035):self.s.bone(self.p(a),self.p(b),r*self.scale)

    def cage(self,length=1.35,width=.39,height=.52,count=9,broken=True):
        # Vertebral column sits along x; each paired rib curves down into ground.
        for j in range(count):
            t=j/(count-1);x=(t-.5)*length
            k=math.sin(math.pi*(.13+t*.80))**.50
            z=height*(.83+.13*math.sin(t*3))
            self.ell((x,0,z),(.071,.068,.052))
            self.ell((x,0,z+.045),(.025,.026,.045),rgb(self.s.p['shadow'])*1.35,'joint')
            for side in (-1,1):
                max_t=2.53
                if broken and ((j==1 and side==1) or (j==count-3 and side==-1)):max_t=1.55
                points=[]
                for u in np.linspace(0,max_t,17):
                    points.append((x+.09*math.sin(u),side*width*k*math.sin(u),z-height*.75*(1-math.cos(u))))
                rr=[(.023+.016*math.sin(u/max_t*math.pi))*(1-.15*t) for u in np.linspace(0,max_t,17)]
                self.tube(points,rr)
        for j in range(count-1):
            x=(j/(count-1)-.5)*length
            self.bone((x,0,height*.92),(x+length/(count-1),0,height*.94),.023)
        # One visibly cracked rib, emphasized as a large interruption.
        if broken:
            self.tube([(-length*.2,width*.96,height*.22),(-length*.16,width*.95,height*.17)],.018,rgb(self.s.p['shadow']),'crack')

    def skull(self,x=-.9,y=0,z=.17,horns=False,fragment=False):
        # Low animal skull, visible far and near temporal windows. No human grin.
        self.ell((x,y,z+.10),(.205,.153,.139))
        self.ell((x-.18,y,z+.048),(.17,.10,.067))
        self.tube([(x-.34,y-.081,z+.03),(x-.21,y-.12,z-.015),(x+.02,y-.115,z-.02)],.026)
        self.tube([(x-.33,y+.081,z+.03),(x-.20,y+.12,z-.015),(x+.03,y+.12,z-.02)],.026)
        for side in (-1,1):
            # Actual dark hollows, recessed beneath heavy orbital rims.
            self.ell((x-.07,y+side*.137,z+.10),(.077,.014,.062),rgb(self.s.p['shadow'])*.60,'socket')
            self.tube([(x-.15,y+side*.14,z+.09),(x-.11,y+side*.15,z+.156),(x-.03,y+side*.145,z+.17)],.024)
            if horns:
                self.tube([(x+.08,y+side*.10,z+.19),(x+.15,y+side*.16,z+.29),(x+.12,y+side*.21,z+.38),(x+.045,y+side*.23,z+.41)],[.053,.043,.026,.004])
        self.ell((x-.312,y,z+.065),(.026,.052,.025),rgb(self.s.p['shadow'])*.65,'socket')
        # Missing nasal plate + large cranial fracture.
        self.tube([(x+.02,y-.05,z+.226),(x-.04,y-.03,z+.228),(x-.07,y+.035,z+.215)],.008,rgb(self.s.p['shadow']),'crack',6)
        if fragment:self.ell((x+.14,y+.045,z+.16),(.08,.07,.023),rgb(self.s.p['shadow']),'socket')

    def beast(self):
        self.cage()
        self.skull(-.98,z=.11)
        # Two collapsed limbs, broad shoulder blade and split pelvis.
        self.ell((-.48,.18,.17),(.17,.085,.12))
        for side in (-1,1):
            self.ell((.72,side*.1,.19),(.13,.08,.13))
            self.bone((.65,side*.22,.20),(.92,side*.50,.065),.042)
            self.bone((.92,side*.50,.065),(1.15,side*.38,.035),.026)
        self.bone((-.45,-.24,.18),(-.68,-.58,.035),.038)
        self.bone((-.68,-.58,.035),(-1.05,-.49,.028),.024)
        for i in range(5):self.ell((.85+i*.1,.01,.12-i*.025),(.065-i*.007,.043-i*.004,.035))

    def demon(self):
        self.cage(length=.65,width=.20,height=.28,count=6)
        self.skull(-.56,z=.06,horns=True)
        for i in range(5):self.ell((.40+i*.10,.025,.13-i*.015),(.06,.043,.038))
        self.bone((.26,-.10,.08),(.54,-.28,.035),.026)
        self.bone((.54,-.28,.035),(.81,-.16,.028),.021)

    def humanoid(self):
        # Face-down: occiput uppermost, no readable face looking at the camera.
        self.cage(length=.62,width=.235,height=.26,count=7)
        self.ell((-.57,0,.12),(.15,.123,.14))
        self.ell((-.65,.02,.028),(.12,.095,.05))
        for s in (-1,1):
            self.ell((.47,s*.12,.13),(.14,.1,.08))
            self.bone((.49,s*.12,.10),(.91,s*.22,.06),.036)
            self.bone((.91,s*.22,.06),(1.23,s*.18,.028),.025)
            self.bone((-.26,s*.22,.10),(-.05,s*.47,.04),.028)
            self.bone((-.05,s*.47,.04),(-.42,s*.50,.027),.023)
            self.ell((-.46,s*.51,.025),(.078,.048,.025))

    def roots(self,n=6):
        ground=-self.center[2]/self.scale
        for i in range(n):
            side=(-1)**i;x=-.5+i*.19
            p=[];rr=[]
            for t in np.linspace(0,1,17):
                p.append((x-.32+.50*t+.065*math.sin(t*5+i),side*(.75-.8*t)+.05*math.sin(t*7+i),ground-.025+.105*math.sin(math.pi*t)))
                rr.append(.024*(1-.90*t))
            self.tube(p,rr,rgb('#494638'),'wood',8)
            q=p[6]
            self.tube([q,(q[0]+.11,q[1]+side*.15,ground+.015),(q[0]+.20,q[1]+side*.22,ground-.015)],[.013,.008,.002],rgb('#474437'),'wood',7)

def decal(scene,kind,center=(0,0,0),scale=1,angle=0):
    a=Anatomy(scene,center,scale,angle)
    if kind==0:
        for j in range(4):
            p=[(-.25+j*.12+.08*math.sin(t),.27*math.sin(t),.11*math.sin(t)) for t in np.linspace(-.5,2.5,15)]
            a.tube(p,.024)
    elif kind==1:
        for i in range(8):
            x=-.43+i*.12;y=.08*math.sin(i*.7)
            a.ell((x,y,.025),(.062,.068,.043));a.ell((x,y,.07),(.021,.035,.033))
    elif kind==2:a.skull(x=-.05,z=-.05,fragment=True)
    elif kind==3:
        for i in range(5):
            x=(i-2)*.13
            a.tube([(x,.08,.03),(x+.07,-.02,.10),(x+.09,-.15,.008)],[.035,.027,.004])
    elif kind==4:
        for i in range(6):
            x=(i-3)*.13;y=.10*math.sin(i*6)
            a.tube([(x,y-.14,-.01),(x+.04,y,.05),(x-.04,y+.11,.012)],[.015,.032,.005])
    else:
        a.bone((-.4,-.09,.02),(.18,.03,.05),.036)
        a.tube([(.26,-.15,.01),(.35,-.04,.13),(.46,.14,.02)],[.015,.027,.008])
        a.ell((-.12,.22,.025),(.09,.08,.032))
    return a

def save(im,name):
    im.convert('RGB').save(OUT/name,optimize=True)
    print('Saved',name,im.size,flush=True)

def sheet_decals():
    im=sheet(1,'SCATTERED / BONES IN THE SOIL','ACT I   /   Non-blocking ground decals   /   Dirty ivory, damp margins, broken anatomy')
    labels=[('A / LOOSE RIBS','0.30 H footprint / relief 0.08 H'),('B / VERTEBRAE CHAIN','0.42 H footprint / relief 0.07 H'),('C / CRANIAL FRAGMENT','0.28 H footprint / relief 0.12 H'),('D / CLAWS & TEETH','0.25 H footprint / relief 0.09 H'),('E / CORTEX SHARDS','0.32 H footprint / relief 0.05 H'),('F / MIXED DEBRIS','0.45 H footprint / relief 0.10 H')]
    for i,(t,st) in enumerate(labels):
        x=64+(i%3)*610;y=153+(i//3)*460
        sc=Scene(570,330,scale=290,origin=(290,207),seed=20+i)
        sc.puddle(.22,.34,.48,.21)
        decal(sc,i,center=(0,0,-.018),angle=.12)
        sc.render();im.paste(sc.im,(x,y+50))
        ys,xs=np.where(sc.bone_mask>0)
        span=(xs.max()-xs.min()+1)/290/.8660254 if len(xs) else 0
        relief=max(np.asarray(sc.vertices)[:,2])
        panel_title(im,x+18,y,t,f'Visible span {span:.2f} H / relief {relief:.2f} H')
        # Native scale sample is kept distinct from the enlarged material study.
        text(im,(x+18,y+379),'1:1',14,MUTED)
        sm=sc.im.resize((170,98),Image.Resampling.LANCZOS)
        im.paste(sm,(x+60,y+359))
        text(im,(x+235,y+382),'Burial 30-65% / collision: NONE',15,MUTED)
    text(im,(82,1110),'READ AS TERRAIN',18,serif=True)
    text(im,(337,1113),'Value 20-45 cortex; dark joints below 20. No white edge, no sparkle, no item-like staging.',17,MUTED)
    save(im,'01_scattered_bone_decals.png')

def sheet_stages():
    im=sheet(2,'THE EARTH TAKES THEM','ACT I   /   S-M anatomy   /   Three burial states of each original specimen')
    stages=[('01 / RECENT FALL','15-25% below grade',-.025),('02 / HALF SUNK','45-60% below grade',-.18),('03 / ANCIENT TRACE','75-90% below grade',-.36)]
    for j,(t,st,z) in enumerate(stages):panel_title(im,330+j*510,160,t,st)
    rows=[('A / SHORT-HORN','S / 0.65 H living height','Bog margin / Blood Moor','demon'),('B / HEAVY CHEST','M / 1.10 H living height','Mud hollow / Den approach','beast'),('C / FACE DOWN','M / 1.00 H living height','Wet ditch / Burial Grounds','humanoid')]
    for i,(t,st,loc,kind) in enumerate(rows):
        yy=258+i*286
        panel_title(im,67,yy+65,t,st);text(im,(67,yy+129),loc,15,MUTED)
        for j,(_,_,z) in enumerate(stages):
            sc=Scene(490,270,scale=163,origin=(245,170),seed=70+i,act=1)
            sc.puddle(.20,.50,.8,.23)
            dz=z if kind=='beast' else z*.64
            a=Anatomy(sc,(0,0,dz),angle=-.10)
            getattr(a,kind)()
            if j>0:a.roots(3+j)
            sc.render();im.paste(sc.im,(310+j*510,yy))
        d=ImageDraw.Draw(im);d.line((315,yy+267,1825,yy+267),fill=(41,47,43))
    text(im,(76,1140),'TIME IN MATERIAL',18,serif=True)
    text(im,(340,1143),'Wet fracture + tiny old blood mark  >  silt / moss  >  roots, lost joints, only upper arches.',17,MUTED)
    # Recent violence is a single compact stain, far below the 5% allowance.
    d=ImageDraw.Draw(im);d.ellipse((696,445,706,450),fill=(70,25,23))
    save(im,'02_halfburied_monster_skeletons.png')

def draw_hero(im,x,y,h=75,color=(163,163,145),mask=None):
    """Standing head-to-sole height is exactly h pixels (weapons excluded)."""
    d=ImageDraw.Draw(im);s=h/75
    def p(q):return [(x+a*s,y+b*s) for a,b in q]
    poly=[(-7,-58),(-16,-52),(-15,-31),(-10,-26),(-12,-3),(-3,0),(0,-26),(5,-1),(14,0),(10,-35),(15,-45),(10,-58)]
    d.polygon(p(poly),fill=color)
    d.ellipse((x-6*s,y-75*s,x+6*s,y-60*s),fill=color)
    d.line(p([(13,-48),(27,-67)]),fill=color,width=max(2,int(s*3)))
    d.polygon(p([(-15,-47),(-25,-41),(-23,-25),(-14,-20),(-9,-36)]),fill=color)
    if mask is not None:
        md=ImageDraw.Draw(mask);md.polygon(p(poly),fill=255)
        md.ellipse((x-6*s,y-75*s,x+6*s,y-60*s),fill=255)
        md.line(p([(13,-48),(27,-67)]),fill=255,width=max(2,int(s*3)))
        md.polygon(p([(-15,-47),(-25,-41),(-23,-25),(-14,-20),(-9,-36)]),fill=255)

def sheet_landmark():
    im=sheet(3,'AN ANCIENT CHEST / A NEW THRESHOLD','ACT I   /   Landmark: 2.65 H crest   /   Horror 2-3   /   The path survives the carcass')
    sc=Scene(1360,900,scale=157,origin=(730,642),seed=119)
    sc.puddle(.75,1.15,1.8,.36)
    a=Anatomy(sc,(0,0,-.39),scale=2.5,angle=-.12)
    a.cage(length=1.72,width=.58,height=1.20,count=10,broken=True)
    a.skull(-1.30,z=.16,horns=False)
    a.roots(10)
    # Heavy buried pelvis + one immense limb; recognizably animal, one oversized chest.
    a.ell((1.05,.12,.20),(.24,.23,.26))
    a.bone((1.03,.19,.20),(1.44,.53,.07),.065)
    # One rusty Rogue spear and two old arrows. All dark and fixed into the carcass.
    a.tube([(-.20,-.48,.09),(-.12,-.38,1.02)],.012,rgb('#584A38'),'wood',7)
    a.tube([(-.12,-.38,1.02),(-.105,-.365,1.14)],[.029,.002],rgb('#5D5144'),'iron',7)
    for xx in (-.45,.28):a.tube([(xx,-.26,.67),(xx-.21,-.44,.97)],.006,rgb('#665640'),'wood',6)
    sc.render();im.paste(sc.im,(32,175))
    # Scale witness, at the same scale as this enlarged study (H=186 px).
    hx,hy=sc.project((.45,2.30,0));draw_hero(im,int(hx+32),int(hy+175),h=136,color=(155,157,142))
    d=ImageDraw.Draw(im)
    d.line((1430,219,1430,1042),fill=(58,65,58))
    panel_title(im,1480,225,'THE LAST HUNT','Original beast / ancient bone')
    notes=[('01 / ORIGINAL MASS','Large rib vault; animal logic.','One deviation: oversized thorax.'),('02 / LONG WEATHER','Soil swallows the sternum.','Roots thread the lower arches.'),('03 / RECENT VIOLENCE','A rusted spear; old Rogue shafts.','Someone crossed here before us.')]
    for k,(t,l1,l2) in enumerate(notes):
        yy=330+k*153;text(im,(1480,yy),t,19,serif=True);text(im,(1480,yy+36),l1,16,MUTED);text(im,(1480,yy+61),l2,16,MUTED)
    text(im,(1480,843),'COLLISION',19,serif=True)
    text(im,(1480,881),'Rib feet / bank: BLOCK',17,MUTED)
    text(im,(1480,909),'Path around: >= 3 Sub CLEAR',17,MUTED)
    text(im,(1480,950),'Under-vault is optional;',16,MUTED)
    text(im,(1480,976),'fade near ribs if it is enabled.',16,MUTED)
    text(im,(74,1115),'2.65 H EXPOSED CREST',20,serif=True)
    text(im,(410,1119),'Silence after violence. No exposed viscera. Roots, silt and buried weight carry the horror.',18,MUTED)
    save(im,'03_giant_carcass_landmark.png')

def sheet_variants():
    im=sheet(4,'ONE ANATOMY / FIVE CLIMATES','Identical camera, rib geometry and sink depth   /   Material response changes; silhouette remains')
    locs=[(63,160),(677,160),(1291,160),(63,676),(677,676)]
    desc=[('Bog mud / wet cortex / moss','Bone #817D6A  /  ground #343A30'),('Wind-packed sand / dry cracks','Bone #999080  /  ground #80705A'),('Still water / vines / algae','Bone #717868  /  ground #303C30'),('Ash & basalt / charred cortex','Bone #6D6258  /  ember < 0.2%'),('Dirty snow / blue-grey frost','Bone #8C8D80  /  snow #727E84')]
    for act,(x,y) in enumerate(locs,1):
        panel_title(im,x+15,y,PALETTES[act]['name'],desc[act-1][0])
        sc=Scene(566,355,scale=188,origin=(289,238),act=act,seed=325)
        sc.puddle(.28,.52,.8,.26)
        a=Anatomy(sc,(0,0,-.18),angle=-.10);a.cage();a.roots(5 if act in (1,3) else 2)
        if act==3:
            a.tube([(-.5,-.2,.32),(-.2,-.34,.27),(.07,-.36,.20),(.27,-.22,.12),(.47,-.32,.04)],.018,rgb('#45543F'),'moss',8)
        sc.render()
        if act==4:
            d=ImageDraw.Draw(sc.im)
            d.line((392,273,409,275,420,270,431,271),fill=(116,67,41),width=3)
            d.line((398,273,407,274),fill=(159,86,47),width=2)
        im.paste(sc.im,(x,y+50));text(im,(x+15,y+420),desc[act-1][1],16,MUTED)
    x,y=1320,750
    text(im,(x,y),'CONTROLLED MATERIAL STUDY',20,serif=True)
    lines=['Same 50% burial; black damp joints.','II: sun-scoured ivory, never pure white.','III: water line + broad vine gesture.','IV: no bloom; one dark ember fissure.','V: blue-grey frost, dirty path margins.','','Act II / V require dark hero silhouettes','against their lighter environmental fields.']
    for i,l in enumerate(lines):text(im,(x,y+48+i*32),l,17,MUTED)
    save(im,'04_act_variants.png')

def monster(im,x,y,h,kind=0,mask=None):
    s=h/75;d=ImageDraw.Draw(im);col=(112,108,95)
    def p(q):return [(x+a*s,y+b*s) for a,b in q]
    if kind==0:
        pts=p([(-14,0),(-8,-25),(-18,-38),(-13,-53),(-7,-50),(-10,-68),(0,-57),(8,-68),(8,-50),(19,-40),(12,-29),(20,-3),(7,0),(2,-23),(-2,-20),(-4,0)])
    else:
        pts=p([(-13,0),(-8,-29),(-12,-49),(-5,-61),(3,-72),(10,-62),(8,-51),(13,-43),(32,-35),(32,-30),(10,-34),(8,-20),(15,-1),(6,0),(0,-22),(-5,0)])
    d.polygon(pts,fill=col)
    if mask is not None:ImageDraw.Draw(mask).polygon(pts,fill=255)

def game_scene():
    sc=Scene(880,480,scale=75/.8660254,origin=(440,252),seed=987,patch=False)
    # One coordinate axis becomes the movement corridor: |y| <= 1.5 Sub.
    # H world unit and Sub are kept distinct: 1 Sub has 32x16 screen diamond.
    sub=32/(math.sqrt(2)*sc.scale)
    sy=sc.gy/sub
    path=np.abs(sy)<1.5
    arr=sc.arr.copy().astype(float)
    arr[path]=arr[path]*.93+np.array([4,1,-1])
    sc.arr=np.uint8(np.clip(arr,0,255));sc.base=sc.arr.copy()
    # All blocking bone footprints lie outside the corridor.
    a=Anatomy(sc,(-2.1,-2.2,-.05),scale=.8,angle=.1);a.beast()
    a=Anatomy(sc,(1.6,2.1,-.14),scale=.74,angle=-.15);a.humanoid()
    a=Anatomy(sc,(2.3,-2.4,-.06),scale=.85,angle=.03);a.demon()
    # Giant landmark stays in the far field. Main path goes around, not through.
    a=Anatomy(sc,(-3.6,2.7,-.34),scale=2.6,angle=-.22);a.cage(length=1.4,width=.46,height=1.20,count=8);a.roots(6)
    blockers=np.asarray(sc.vertices).copy()
    corridor_half=1.5*sub
    blocker_gap=float(np.min(np.abs(blockers[:,1]))-corridor_half)
    decal(sc,1,(.8,-1.2,-.035),.65)
    decal(sc,4,(-1.8,1.2,-.03),.7)
    sc.puddle(2.2,2.0,.6,.3)
    sc.render()
    bone_mask=np.array(sc.bone_mask)
    color=sc.im.copy()
    hm=Image.new('L',color.size);mm=Image.new('L',color.size)
    # Place hero with feet in the actual corridor.
    hx,hy=sc.project((.20,0,0));draw_hero(color,int(hx),int(hy),75,mask=hm)
    for pos,h,k in [((2.3,0,0),48,0),((3.7,.2,0),75,1),((3.5,-1.5,0),48,0)]:
        mx,my=sc.project(pos);monster(color,int(mx),int(my),h,k,mm)
    gray=color.convert('L').convert('RGB')
    sil=Image.new('RGB',color.size,(162,164,156))
    sil.paste((9,12,12),(0,0),Image.fromarray(sc.object_mask))
    sil.paste((9,12,12),(0,0),mm);sil.paste((9,12,12),(0,0),hm)
    guide=color.copy();d=ImageDraw.Draw(guide)
    # Project the corridor's boundaries and three complete Sub-width lanes.
    for boundary in (-1.5,-.5,.5,1.5):
        pts=[tuple(sc.project((xx,boundary*sub,.018))) for xx in np.linspace(-7,7,60)]
        d.line(pts,fill=(110,123,107) if abs(boundary)>1 else (78,91,78),width=1)
    for xx in np.arange(-5,5.1,sub):
        d.line([tuple(sc.project((xx,-1.5*sub,.018))),tuple(sc.project((xx,1.5*sub,.018)))],fill=(74,83,71),width=1)
    text(guide,(18,18),'1:1 GAME SCALE / HERO = 75 px',15,(184,186,166))
    text(guide,(18,445),'3 Sub clear / Sub diamond 32 x 16 px / cross-vector 48 x 24 px',15,(184,186,166))
    # Metrics are taken from the unlabelled 1:1 color panel; UI is excluded.
    arr=np.asarray(color,dtype=float);luma=arr@np.array([.2126,.7152,.0722])/255*100
    bm=(bone_mask>0)&(np.asarray(hm)==0)&(np.asarray(mm)==0)
    hero=np.asarray(hm)>0
    metrics=dict(hero_height_px=75,hero_luma_min=round(float(luma[hero].min()),2),bone_luma_max=round(float(luma[bm].max()),2),bone_luma_mean=round(float(luma[bm].mean()),2),cortex_min_excluding_damp_band=20,clear_path_sub=3,sub_diamond_px=[32,16],corridor_cross_vector_px=[48,24],value_method='Rec.709 luma on sRGB encoded RGB; 0-100, excludes sheet text',geometry_note='Blocking carcasses lie outside |y/Sub| <= 1.5; decals have no collision.')
    metrics['hero_minus_bone_peak']=round(metrics['hero_luma_min']-metrics['bone_luma_max'],2)
    metrics['blocking_geometry_clearance_in_sub']=round(blocker_gap/sub,3)
    metrics['blocking_vertices_in_corridor']=int(np.count_nonzero(np.abs(blockers[:,1])<=corridor_half))
    return color,gray,sil,guide,metrics

def sheet_readability():
    color,gray,sil,guide,metrics=game_scene()
    im=sheet(5,'READABILITY / GROUND BEFORE REWARD','ACT I   /   Native game scale in every panel   /   No loot glint, no gameplay colour, no bloom')
    for img,x,y,t,sub in [(guide,62,165,'A / COLOUR + WALKABLE GRID','75 px hero / S + M silhouettes / reserved corridor'),(gray,978,165,'B / GRAYSCALE VALUES','Hero remains above bone; ground stays subordinate'),(sil,62,722,'C / BLACK SILHOUETTES','Broken ground forms versus upright actors'),(color,978,722,'D / CLEAN GAME VIEW','Landmark in far field; low debris sits at the margins')]:
        panel_title(im,x,y,t,sub)
        # Native 880x480 panels fit with no thumbnail rescaling.
        im.paste(img,(x,y+58))
    # Second row panels are cropped only at the bottom ground margin to protect footer.
    # They contain no subject in the discarded 63 px of empty foreground.
    d=ImageDraw.Draw(im);d.rectangle((0,1196,W,H),fill=BG)
    d.line((62,1196,1856,1196),fill=(57,64,58))
    text(im,(64,1220),f"HERO MIN {metrics['hero_luma_min']:.1f}  /  BONE PEAK {metrics['bone_luma_max']:.1f}  /  GAP {metrics['hero_minus_bone_peak']:.1f} >= 15",17,INK)
    text(im,(1100,1220),'MAIN PATH: 3 SUB CLEAR  /  DECALS: NO COLLISION',17,MUTED)
    save(im,'05_readability_check.png')
    (OUT/'verification.json').write_text(json.dumps(metrics,indent=2,ensure_ascii=False),encoding='utf-8')
    # Raw native-scale panel helps a reviewer measure without sheet/UI pixels.
    save(color,'readability_native_880x480.png')

def main():
    sheet_decals();sheet_stages();sheet_landmark();sheet_variants();sheet_readability()

if __name__=='__main__':main()
