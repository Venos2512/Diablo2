"""Original Act I tree studies. Python 3 + Pillow + NumPy; no downloaded assets.
Run from anywhere: python art-output/tree-concepts/generate_trees.py
All writes stay beside this script. Deterministic seeds; encoded-luma pixel QA.
"""
from pathlib import Path
import json, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

OUT = Path(__file__).resolve().parent
W, H = 1800, 1200
P = dict(dark='#1B1F1C', mid='#3E4638', light='#6F6F5C',
         wood='#454A40', woodlight='#696B59', moss='#515B43',
         char='#303942', ash='#70777B', deepchar='#171C22',
         fire='#D9822B', core='#E7C890', ground='#343C32', hero='#929586')
INK=(198,190,168); MUTED=(128,139,125); RULE=(64,73,62)

def rgb(c):
    if not isinstance(c,str): return tuple(c)
    return tuple(int(c[i:i+2],16) for i in (1,3,5))

def mix(a,b,t): return tuple(round(x*(1-t)+y*t) for x,y in zip(rgb(a),rgb(b)))
def font(n,serif=False):
    # Match the rock studies; Times supports the full Vietnamese glyph range.
    return ImageFont.truetype('C:/Windows/Fonts/'+('times.ttf' if serif else 'segoeui.ttf'),n)
def txt(im,xy,s,n=18,c=INK,serif=False):
    ImageDraw.Draw(im).text(xy,s,font=font(n,serif),fill=c)
def lines(im,xy,items,n=17,c=MUTED,gap=27):
    for i,s in enumerate(items):txt(im,(xy[0],xy[1]+i*gap),s,n,c)
def stroke(im,pts,c,w=1):ImageDraw.Draw(im).line(pts,fill=c,width=max(1,round(w)),joint='curve')
def poly(im,pts,c):ImageDraw.Draw(im).polygon(pts,fill=c)

def board(num,title,subtitle):
    yy,xx=np.mgrid[:H,:W]
    v=np.exp(-(((xx-W*.5)/(W*.72))**2+((yy-H*.52)/(H*.9))**2))
    noise=np.random.default_rng(900+num).normal(0,.65,(H,W))
    a=np.stack([15+12*v+noise,20+14*v+noise,19+11*v+noise],axis=-1)
    im=Image.fromarray(np.uint8(np.clip(a,0,255)))
    txt(im,(60,36),f'ACT I  /  WILDERNESS STUDIES                                      {num:02d} / 05',16,MUTED)
    txt(im,(58,74),title,39,INK,True)
    txt(im,(60,132),subtitle,18,MUTED)
    stroke(im,[(60,178),(1740,178)],RULE)
    stroke(im,[(60,1124),(1740,1124)],RULE)
    txt(im,(60,1142),'TREE CONCEPTS  /  THIẾT KẾ NGUYÊN BẢN  /  H = 75 px  /  ISOMETRIC 2:1',15,MUTED)
    txt(im,(1190,1142),'ÁNH SÁNG TRÊN–TRÁI  /  BÓNG DƯỚI–PHẢI',14,MUTED)
    return im

def swatches(im,x,y,keys):
    d=ImageDraw.Draw(im)
    for i,k in enumerate(keys):
        xx=x+i*146;d.rectangle((xx,y,xx+28,y+19),fill=rgb(P[k]))
        txt(im,(xx+37,y),P[k],14,MUTED)

def ground(im,x,y,r=125,seed=1,ash=False,grid=False):
    rr=random.Random(seed);d=ImageDraw.Draw(im)
    for k in range(13,0,-1):
        t=k/13; col=mix((27,34,28), (43,49,39),1-t)
        d.ellipse((x-r*t,y-r*.38*t,x+r*t,y+r*.38*t),fill=col)
    for _ in range(int(r*1.2)):
        u=rr.uniform(-r,r);v=rr.uniform(-r*.30,r*.30)
        if (u/r)**2+(v/(r*.32))**2>1:continue
        c=rr.choice([(47,54,43),(53,59,47),(32,40,34),(57,59,50)])
        if ash:c=rr.choice([(53,58,59),(67,72,73),(41,47,50)])
        d.line((x+u,y+v,x+u+rr.uniform(3,10),y+v-rr.uniform(1,3)),fill=c,width=2)
    if grid:
        for u in range(-2,3):
            stroke(im,[(x+u*32-64,y+u*16+32),(x+u*32+64,y+u*16-32)],(58,66,54))
            stroke(im,[(x+u*32-64,y-u*16-32),(x+u*32+64,y-u*16+32)],(58,66,54))

def spline(points,steps=9):
    a=np.array([points[0]]+points+[points[-1]],float);out=[]
    for i in range(1,len(a)-2):
        p0,p1,p2,p3=a[i-1:i+3]
        for t in np.linspace(0,1,steps,endpoint=False):
            curved=.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t)
            out.append(curved*.64+(p1*(1-t)+p2*t)*.36)
    out.append(a[-2]);return np.array(out)

class Painter:
    """Tapered organic tubes with broad bark ridges and directional half-light.
    Large plate cracks follow grain; material texture is separate from silhouette.
    Coordinates: screen-ground x/y (already 2:1 projected), height points upward.
    """
    def __init__(self,seed=1,kind='wood'):
        self.im=Image.new('RGBA',(1600,1400));self.r=random.Random(seed)
        self.seed=seed;self.kind=kind;self.base=np.array([800.,1150.]);self.unit=760
        self.records=[]
    def pt(self,p):return self.base+np.array(p)*self.unit
    def tube(self,points,w0,w1=.002,mat=None,scar=False):
        mat=mat or self.kind
        path=spline([self.pt(p) for p in points])
        tang=np.gradient(path,axis=0);norm=np.stack([-tang[:,1],tang[:,0]],axis=-1)
        norm/=np.maximum(np.linalg.norm(norm,axis=1)[:,None],.001)
        t=np.linspace(0,1,len(path));width=(w0*(1-t)**.85+w1*t)*self.unit
        width*=1+.13*np.sin(t*21+self.seed)+.07*np.sin(t*49+self.seed)
        path+=norm*(np.sin(t*29+self.seed)*width*.065)[:,None]
        a=path+norm*width[:,None];b=path-norm*width[:,None]
        shape=[tuple(p) for p in np.vstack([a,b[::-1]])]
        mask=Image.new('L',self.im.size);ImageDraw.Draw(mask).polygon(shape,fill=255)
        box=mask.getbbox()
        if not box:return
        x0,y0,x1,y1=box
        yy,xx=np.mgrid[y0:y1,x0:x1]
        # Large, low-frequency weathering; no universal white-noise grunge layer.
        rng=np.random.default_rng(self.seed+int(abs(points[-1][0])*1000)+len(path))
        coarse=Image.fromarray(np.uint8(rng.uniform(65,185,(max(2,(y1-y0)//15),max(2,(x1-x0)//15)))))
        coarse=np.asarray(coarse.resize((x1-x0,y1-y0),Image.Resampling.BILINEAR)).astype(float)/255-.5
        if mat in ('char','fresh','old'):
            base=rgb(P['char']);light=(80,88,95);dark=rgb(P['deepchar'])
        elif mat=='ash':base=(76,82,85);light=(108,115,117);dark=(42,50,57)
        else:base=rgb(P['wood']);light=rgb(P['woodlight']);dark=(51,58,52)
        # The same world-space upper-left light direction on every branch.
        lightvec=np.array([-.8,-.6]);lit=norm@lightvec
        light_side=np.where(lit>=0,1,-1)
        # Cross-section shading replaces flat alternating outline stripes.
        volume=Image.new('RGB',(x1-x0,y1-y0),base);vd=ImageDraw.Draw(volume)
        strips=np.linspace(-1,1,19)
        for j in range(len(path)-1):
            for q0,q1 in zip(strips[:-1],strips[1:]):
                q=(q0+q1)*.5
                diffuse=.20+.43*math.sqrt(max(0,1-q*q))+.34*q*float(lit[j])
                diffuse+=.035*math.sin(t[j]*42+q*14+self.seed)
                c=mix(dark,light,max(0,min(1,diffuse)))
                pp=[path[j]+norm[j]*width[j]*q0,path[j]+norm[j]*width[j]*q1,
                    path[j+1]+norm[j+1]*width[j+1]*q1,path[j+1]+norm[j+1]*width[j+1]*q0]
                vd.polygon([(round(z[0]-x0),round(z[1]-y0)) for z in pp],fill=c)
        col=np.asarray(volume).astype(float)+coarse[:,:,None]*36
        col+=np.sin(yy*.031+xx*.013)[:,:,None]*2
        patch=Image.fromarray(np.uint8(np.clip(col,0,255))).convert('RGBA')
        self.im.paste(patch,(x0,y0),mask.crop(box))
        lay=Image.new('RGBA',self.im.size);ld=ImageDraw.Draw(lay)
        # Splintered bark plates have depth and uneven lengths. Their large
        # dimensions survive reduction; thin secondary grain is omitted on twigs.
        if w0>.055:
            for _ in range(11):
                lo=self.r.uniform(.07,.83);hi=min(.98,lo+self.r.uniform(.07,.18))
                ix=np.arange(int(lo*(len(path)-1)),max(2,int(hi*(len(path)-1))))
                if len(ix)<2:continue
                q=self.r.uniform(-.70,.65);thick=self.r.uniform(.07,.16)
                jag=.045*np.sin(t[ix]*93+self.r.uniform(0,6))
                side1=path[ix]+norm[ix]*((q+jag)*width[ix])[:,None]
                side2=path[ix]+norm[ix]*((q+thick+jag)*width[ix])[:,None]
                c=mix(dark,base,.18 if mat=='wood' else .38)
                ld.polygon([tuple(z) for z in np.vstack([side1,side2[::-1]])],fill=(*c,210))
                if q*float(np.mean(lit[ix]))>0:
                    ld.line([tuple(z) for z in side1[:max(2,len(side1)//2)]],fill=(*mix(base,light,.45),190),width=3)
        # Broad irregular longitudinal flutes, with broken highlights.
        for q in [-.69,-.21,.43]:
            jitter=np.sin(t*23+q*9+self.seed)*.13+np.sin(t*49+q*11)*.06
            pp=path+norm*((q+jitter)*width)[:,None]
            bright=float(np.mean(light_side*q))>0
            c=mix(base,light,.25) if bright else mix(base,dark,.8)
            ww=max(3,int(w0*self.unit*.07))
            # Grain runs in broken plates, not continuous decorative contours.
            for f in (.10,.39,.72):
                j=int((f+self.r.uniform(-.06,.04))*len(pp));end=min(len(pp),j+max(3,len(pp)//6))
                ld.line([tuple(p) for p in pp[j:end]],fill=(*c,180),width=ww,joint='curve')
            if abs(q)<.6 and w0>.025:
                for f in (.16,.45,.73):
                    j=int((f+self.r.uniform(-.05,.05))*len(pp));end=min(len(pp),j+max(3,len(pp)//7))
                    ld.line([tuple(p) for p in pp[j:end]],fill=(*dark,190),width=max(3,ww))
        if mat in ('char','fresh','old','ash'):
            # Char contracts into plates; broad cross-grain splits, cold lit lips.
            for f in np.arange(.13,.94,.19):
                j=min(len(path)-1,int((f+self.r.uniform(-.025,.025))*len(path)))
                p=path[j];n=norm[j];v=tang[j]/max(.1,np.linalg.norm(tang[j]))
                crack=[p-n*width[j]*.6,p+v*7-n*width[j]*.12,p+n*width[j]*.49]
                ld.line([tuple(z) for z in crack],fill=(*dark,255),width=6)
                ld.line([tuple(z+np.array([-2.,-2.])) for z in crack],fill=(*mix(base,light,.6),220),width=2)
        lay.putalpha(ImageChops.multiply(lay.getchannel('A'),mask))
        self.im=Image.alpha_composite(self.im,lay)
        self.records.append((path,width))
        if scar:
            p=path[-1];n=norm[-1];v=tang[-1]/np.linalg.norm(tang[-1]);w=max(5,width[-1])
            c=(84,85,70) if mat=='wood' else (66,73,79)
            d=ImageDraw.Draw(self.im)
            d.polygon([tuple(p+n*w),tuple(p+n*w*.35-v*w*.52),tuple(p-n*w),tuple(p-n*w*.45+v*w*.45)],fill=c)
            d.line([tuple(p+n*w*.7),tuple(p-n*w*.6)],fill=(30,36,34),width=4)
    def patch(self,pts,col):poly(self.im,[tuple(self.pt(p)) for p in pts],rgb(col))
    def line(self,pts,col,w=3):stroke(self.im,[tuple(self.pt(p)) for p in pts],rgb(col),w)
    def moss(self,count=25):
        d=ImageDraw.Draw(self.im)
        for _ in range(count//2):
            x=self.r.uniform(-.12,.10);y=self.r.uniform(-.26,.015)
            p=self.pt((x,y));rx=self.r.uniform(8,19);ry=self.r.uniform(8,26)
            if self.im.getpixel(tuple(np.int32(p)))[3]:
                pts=[]
                for ang in np.linspace(0,math.tau,12,endpoint=False):
                    rad=self.r.uniform(.6,1.0);pts.append((p[0]+math.cos(ang)*rx*rad,p[1]+math.sin(ang)*ry*rad))
                d.polygon(pts,fill=(*rgb(self.r.choice([P['moss'],'#454F3C','#59634A'])),255))
    def weeds(self):
        for x,y in [(-.19,.03),(.21,.06),(-.10,.10),(.31,-.01)]:
            for dx,dy in [(-.028,-.055),(0,-.07),(.024,-.041)]:
                self.line([(x,y),(x+dx*.4,y+dy*.5),(x+dx,y+dy)],P['moss'],5)
    def finish(self):
        box=self.im.getbbox()
        assert box[0]>0 and box[1]>0 and box[2]<self.im.width and box[3]<self.im.height, 'Canonical sprite is clipped'
        crop=self.im.crop(box)
        return Asset(crop,(self.base[0]-box[0],self.base[1]-box[1]))

class Asset:
    def __init__(self,im,anchor):self.im=im;self.anchor=anchor
    def scaled(self,height):
        s=height/self.anchor[1];wh=tuple(max(1,round(a*s)) for a in self.im.size)
        return self.im.resize(wh,Image.Resampling.LANCZOS),(round(self.anchor[0]*s),round(self.anchor[1]*s))

def roots(p,wide=1):
    for pts,w in [([(0,-.065),(-.12,-.01),(-.26,.045),(-.34,.035)],.055),
                  ([(.01,-.07),(.13,-.005),(.28,.07),(.37,.065)],.05),
                  ([(-.01,-.06),(-.055,.06),(-.15,.13),(-.25,.145)],.052),
                  ([(.02,-.04),(.12,.09),(.22,.125)],.04),
                  ([(-.01,-.04),(.03,-.045),(.16,-.09),(.24,-.10)],.033)]:
        p.tube([(x*wide,y) for x,y in pts],w,.002)

def tree(name='tall',kind='wood',seed=11):
    p=Painter(seed,kind);roots(p,.55 if name=='sapling' else 1)
    if name=='sapling':
        p.tube([(0,0),(-.045,-.30),(.015,-.59),(-.035,-.80),(.025,-1.0)],.035)
        branches=[([(-.024,-.39),(-.22,-.53),(-.27,-.74),(-.21,-.81)],.025),
                  ([(0,-.59),(.16,-.66),(.23,-.87)],.021),
                  ([(-.23,-.61),(-.36,-.64),(-.4,-.76)],.012),
                  ([(-.02,-.79),(-.15,-.89),(-.13,-1.03)],.017)]
    elif name=='medium':
        p.tube([(0,0),(-.075,-.22),(-.04,-.39),(.09,-.54),(.025,-.73),(.12,-.91),(.07,-1.02)],.11,.004)
        branches=[([(-.05,-.32),(-.28,-.43),(-.43,-.60),(-.37,-.81),(-.47,-.94)],.068),
                  ([(.065,-.53),(.32,-.59),(.48,-.75),(.43,-.91)],.060),
                  ([(-.4,-.60),(-.63,-.61),(-.71,-.73),(-.68,-.84)],.038),
                  ([(.34,-.62),(.62,-.61),(.72,-.76)],.034),
                  ([(.03,-.72),(-.16,-.79),(-.23,-.98),(-.15,-1.09)],.035),
                  ([(-.38,-.79),(-.24,-.86),(-.24,-1.0)],.025),
                  ([(.49,-.74),(.61,-.89),(.60,-1.0)],.023),
                  ([(-.60,-.62),(-.65,-.51),(-.76,-.48)],.018)]
    elif name=='leaning':
        p.tube([(0,0),(-.03,-.20),(.13,-.37),(.37,-.52),(.57,-.73),(.79,-.80)],.105,.022,scar=True)
        branches=[([(.11,-.36),(-.12,-.52),(-.18,-.73),(-.09,-.84)],.055),
                  ([(.36,-.52),(.26,-.77),(.37,-.97)],.051),
                  ([(.58,-.73),(.64,-.93),(.82,-1.03)],.036),
                  ([(.33,-.53),(.57,-.47),(.84,-.50),(.99,-.65)],.046),
                  ([(.58,-.48),(.7,-.29),(.87,-.25)],.027),
                  ([(-.16,-.67),(-.31,-.69),(-.4,-.84)],.025)]
        p.patch([(-.14,0),(-.09,-.21),(-.04,-.12),(-.025,-.025)],'#232B25')
    elif name=='burn':
        p.tube([(0,0),(-.065,-.22),(.025,-.40),(-.045,-.65),(.02,-.86),(-.035,-1.0)],.095,.027,scar=True)
        branches=[([(-.025,-.38),(-.25,-.45),(-.36,-.60),(-.32,-.83)],.059),
                  ([(-.02,-.60),(.20,-.68),(.30,-.88),(.26,-.98)],.047),
                  ([(-.34,-.62),(-.5,-.67),(-.57,-.81)],.033),
                  ([(.21,-.7),(.41,-.65),(.54,-.72)],.032),
                  ([(.0,-.86),(-.13,-.92),(-.20,-1.06)],.024)]
    elif name=='landmark':
        # Two asymmetrical living columns enclose a unique, open keyhole shape.
        p.tube([(-.04,0),(-.14,-.20),(-.19,-.43),(-.11,-.61),(.05,-.76),(.12,-.94),(.05,-1.07)],.115,.006)
        p.tube([(.08,0),(.18,-.20),(.16,-.38),(.06,-.53),(-.02,-.70)],.092,.037)
        branches=[([(-.15,-.38),(-.35,-.52),(-.56,-.56),(-.67,-.73),(-.61,-.89)],.075),
                  ([(-.12,-.58),(-.35,-.73),(-.43,-.95),(-.34,-1.08)],.062),
                  ([(.05,-.74),(.31,-.69),(.48,-.76),(.56,-.98),(.71,-1.03)],.063),
                  ([(.17,-.33),(.36,-.42),(.56,-.45),(.68,-.60)],.061),
                  ([(.31,-.70),(.40,-.89),(.36,-1.03)],.034),
                  ([(-.53,-.56),(-.71,-.49),(-.81,-.57)],.037),
                  ([(-.44,-.93),(-.6,-1.02),(-.56,-1.14)],.028),
                  ([(-.66,-.73),(-.82,-.78),(-.86,-.91)],.028)]
        p.tube([(.34,-.42),(.43,-.55),(.40,-.66)],.05,.022,scar=True)
    else:
        p.tube([(0,0),(-.06,-.22),(.04,-.43),(-.045,-.63),(.035,-.82),(-.02,-1.04)],.085,.003)
        branches=[([(.0,-.4),(-.21,-.49),(-.35,-.66),(-.29,-.85),(-.41,-.98)],.059),
                  ([(-.03,-.61),(.20,-.66),(.36,-.82),(.29,-1.02)],.055),
                  ([(-.34,-.66),(-.53,-.65),(-.64,-.78),(-.60,-.92)],.030),
                  ([(.23,-.69),(.48,-.65),(.59,-.80),(.57,-.93)],.031),
                  ([(.03,-.82),(-.13,-.91),(-.12,-1.11)],.027),
                  ([(-.3,-.82),(-.15,-.88),(-.13,-1.0)],.020),
                  ([(.35,-.83),(.47,-.96),(.44,-1.10)],.019),
                  ([(-.54,-.66),(-.66,-.57),(-.77,-.62)],.017)]
    for bi,(pts,w) in enumerate(branches):
        if kind=='old' and bi==4:continue
        broken=name=='burn' or (name!='sapling' and bi%3==1)
        p.tube(pts,w,.009 if broken else .0015,scar=broken)
    if kind=='wood' or kind=='old':p.moss(40 if name=='landmark' else 24)
    if kind=='old':p.weeds()
    if kind=='fresh':
        for pts in [[(-.026,-.19),(-.043,-.28),(-.018,-.34),(-.022,-.42)],
                    [(.011,-.47),(-.014,-.55),(-.005,-.60)],
                    [(-.24,-.46),(-.29,-.51),(-.29,-.57)]]:
            p.line(pts,P['deepchar'],13);p.line(pts,P['fire'],7)
            p.line(pts[1:3],P['core'],3)
    if name=='landmark':
        # Old carvings, damaged vow tokens, deliberately no magical emission.
        p.line([(-.20,-.27),(-.21,-.34),(-.17,-.37),(-.14,-.33)],'#252D29',7)
        p.line([(-.19,-.27),(-.20,-.33),(-.17,-.35)],'#73745D',3)
        p.line([(-.31,-.60),(-.18,-.55),(.01,-.53),(.22,-.56),(.40,-.63)],'#69644D',7)
        p.line([(-.31,-.605),(-.18,-.555),(.01,-.535),(.22,-.565),(.40,-.635)],'#363B30',3)
        for x,y,length in [(-.18,-.55,.13),(.07,-.535,.17),(.28,-.58,.095)]:
            p.line([(x,y),(x-.015,y+length)],'#77715A',4)
            p.patch([(x-.035,y+length-.01),(x+.023,y+length-.02),(x+.035,y+length+.05),(x+.005,y+length+.04),(x-.02,y+length+.065)],'#86816C')
            p.line([(x-.008,y+length+.005),(x+.012,y+length+.028)],'#424A3D',4)
        p.patch([(.04,-.04),(.06,-.19),(.10,-.27),(.12,-.10),(.13,-.035)],'#303942')
    return p.finish()

def stump(kind='wood',seed=32):
    p=Painter(seed,kind);roots(p)
    p.tube([(0,0),(-.035,-.18),(-.025,-.31)],.16,.11,scar=True)
    # Jagged rotted rim around a top-down visible hollow.
    p.patch([(-.14,-.29),(-.12,-.38),(-.065,-.31),(-.03,-.36),(.035,-.30),(.11,-.33),(.135,-.26),(.06,-.21),(-.06,-.23)],'#616552' if kind=='wood' else '#626B70')
    p.patch([(-.10,-.29),(-.04,-.32),(.045,-.29),(.083,-.255),(-.012,-.25)],'#222B25' if kind=='wood' else P['deepchar'])
    p.tube([(-.10,-.09),(-.27,-.18),(-.30,-.29)],.045,.012,scar=True)
    if kind=='wood':p.moss(26)
    return p.finish()

def debris(name,kind='wood',seed=45):
    p=Painter(seed,kind)
    if name in ('log','broken','collapsed'):
        # Fallen axes follow the ground diamond, top faces remain visible.
        p.tube([(-.52,-.17),(-.30,-.20),(-.03,-.12),(.25,-.03),(.53,.015)],.085,.061,scar=True)
        for pts in [[(-.3,-.2),(-.36,-.37),(-.48,-.40)],
                    [(-.04,-.13),(.08,-.31),(.06,-.42)],
                    [(.25,-.03),(.36,-.19),(.49,-.23)]]:p.tube(pts,.035,.005,scar=True)
        if name=='broken':
            p.patch([(-.05,-.18),(.005,-.25),(.03,-.15),(.10,-.19),(.05,-.09)],'#71715C')
        if kind=='wood':p.moss(7)
    elif name in ('pile','twigs'):
        rr=random.Random(seed)
        for j in range(6 if name=='pile' else 4):
            x=rr.uniform(-.40,.2);y=rr.uniform(-.15,.07);dx=rr.uniform(.25,.5);dy=rr.uniform(-.22,.20)
            w=.025 if name=='pile' else .009
            p.tube([(x,y),(x+dx*.45,y+dy*.3-.025),(x+dx,y+dy)],w,.002)
            p.tube([(x+dx*.45,y+dy*.3-.025),(x+dx*.50,y+dy*.3-.09),(x+dx*.75,y+dy*.3-.12)],w*.55,.001)
    elif name=='roots':
        roots(p,1.6)
        p.tube([(0,0),(.06,-.13),(.02,-.28),(-.07,-.40)],.10,.035,scar=True)
        for x,y in [(-.31,-.10),(.35,-.07),(-.4,.08)]:p.tube([(0,-.05),(x*.5,y-.08),(x,y)],.05,.004)
        p.moss(12)
    elif name=='bramble':
        rr=random.Random(seed)
        for j in range(7):
            x=-.4+j*.12;lean=rr.uniform(-.15,.14);hi=rr.uniform(.25,.47)
            pts=[(x,rr.uniform(-.03,.03)),(x+lean*.3,-hi*.34),(x+lean,-hi*.7),(x+lean*.8,-hi)]
            p.tube(pts,.020,.002)
            p.tube([(x,-.15),(x-.14,-.22),(x-.16,-.31)],.012,.001)
            p.patch([(x+lean*.6,-hi*.6),(x+lean*.6-.016,-hi*.68),(x+lean*.6+.022,-hi*.62)],'#696B59')
        p.tube([(-.48,-.06),(-.25,-.14),(-.09,-.055),(.13,-.17),(.39,-.07)],.019,.007)
        p.tube([(-.38,-.02),(-.20,-.075),(.03,-.02),(.23,-.11),(.44,-.045)],.015,.004)
    return p.finish()

def paste_asset(im,asset,x,y,height,shadow=True,alpha=1,sil=False):
    sprite,anc=asset.scaled(height)
    ox,oy=round(x-anc[0]),round(y-anc[1])
    if shadow:
        m=np.array(sprite.getchannel('A'));sy,sx=np.nonzero(m>80)
        sh=Image.new('RGBA',im.size);d=ImageDraw.Draw(sh)
        # Project canopy onto the ground toward bottom-right; contact is darkest.
        pts=[(ox+int(xx)+int((anc[1]-yy)*.42),round(y+(anc[1]-yy)*.16+(xx-anc[0])*.07)) for yy,xx in zip(sy[::16],sx[::16])]
        for xx,yy in pts:d.ellipse((xx-2,yy-1,xx+2,yy+1),fill=(15,23,24,95))
        sh=sh.filter(ImageFilter.GaussianBlur(2))
        im.paste(Image.alpha_composite(im.convert('RGBA'),sh).convert('RGB'))
        d=ImageDraw.Draw(im);rx=max(8,height*.13)
        d.ellipse((x-rx,y-rx*.23,x+rx,y+rx*.23),fill=(20,28,27))
    if sil:
        z=Image.new('RGBA',sprite.size,(0,0,0));z.putalpha(sprite.getchannel('A'));sprite=z
    if alpha!=1:sprite.putalpha(sprite.getchannel('A').point(lambda a:round(a*alpha)))
    im.paste(sprite,(ox,oy),sprite)
    return sprite,(ox,oy),anc

def hero(height=75,color=None):
    # Head-to-ground bounds exactly 75 px at 1H. Weapon does not alter height.
    s=4;im=Image.new('RGBA',(42*s,75*s));d=ImageDraw.Draw(im)
    body=[(17,14),(10,19),(7,36),(10,45),(14,41),(13,53),(9,72),(7,74),(17,74),(21,56),(25,73),(34,74),(33,70),(27,51),(28,39),(32,44),(36,40),(33,23),(27,16)]
    c=rgb(color or P['hero'])
    d.polygon([(x*s,y*s) for x,y in body],fill=c)
    d.ellipse((16*s,0,27*s,15*s),fill=c)
    d.polygon([(7*s,26*s),(1*s,29*s),(0,46*s),(10*s,50*s),(16*s,39*s),(14*s,28*s)],fill=c)
    d.line((35*s,24*s,40*s,64*s),fill=c,width=2*s)
    return im.resize((round(42*height/75),height),Image.Resampling.LANCZOS)

def place_hero(im,x,y,height=75,color=None,outline=False):
    h=hero(height,color);xy=(round(x-h.width/2),round(y-h.height))
    if outline:
        a=h.getchannel('A');wide=a.filter(ImageFilter.MaxFilter(5))
        edge=ImageChops.subtract(wide,a);edgeim=Image.new('RGB',h.size,(175,182,159));im.paste(edgeim,xy,edge)
    im.paste(h,xy,h)
    return h,xy

def caption(im,x,y,title,detail):
    txt(im,(x,y),title,22,INK,True);txt(im,(x,y+33),detail,16,MUTED)

def sheet1():
    im=board(1,'CÂY TRỤI / ĐỒNG HOANG ẨM','Blood Moor → Cold Plains → Dark Wood  ·  Nặng, mục, bất đối xứng; khoảng trống giữa cành gánh nhận diện.')
    swatches(im,60,209,['dark','mid','light','wood','moss'])
    specs=[('sapling',205,1.0,'A  /  CHỒI HÉO','1.0 H · thân mảnh · 1×1 Sub'),
           ('medium',550,1.8,'B  /  THÂN QUẶP','1.8 H · tán ngang · 2×2 Sub'),
           ('tall',1030,2.8,'C  /  THÂN XOẮN','2.8 H · trục cao · 2×2 Sub'),
           ('leaning',1450,1.6,'D  /  BẬT GỐC','1.6 H · nghiêng · 3×2 Sub')]
    for i,(name,x,h,title,note) in enumerate(specs):
        ground(im,x,862,140 if i else 105,10+i)
        paste_asset(im,tree(name,seed=11+i),x,850,h*195)
        caption(im,x-145,932,title,note)
        stroke(im,[(x-145,916),(x-92,916)],(113,113,85),2)
    # Small props are deliberately kept low in the front of gameplay spaces.
    ground(im,165,1051,84,92);paste_asset(im,stump(),165,1044,59)
    txt(im,(290,1018),'E  /  GỐC MỤC  ·  0.3 H  ·  PROP THẤP',17,INK)
    lines(im,(290,1048),['Vân lớn theo thớ; rêu ở chân và mặt giữ ẩm. Đầu gãy xỉn, không vàng sạch.',
                         'Cây đứng là prop cản đường có bóng; không lấy toàn bộ tán làm vùng va chạm.'],16)
    txt(im,(60,276),'MẪU PHÓNG 2.6×  /  GỐC CÂY LÀ ĐIỂM NEO',14,MUTED)
    im.save(OUT/'01_act1_dead_trees.png')

def sheet2():
    im=board(2,'CÀNH KHÔ / GỖ CHẾT / RỄ','Tách lớp sàn và vật cản  ·  Cụm 3–7 mảnh; không rải đều; hình cành đọc trước texture.')
    items=[('log','A  /  THÂN ĐỔ','PROP CẢN · cao 0.35 H · 3×1 Sub'),
           ('pile','B  /  CỤM CÀNH','PROP THẤP CẢN · 0.25 H · 2×1 Sub'),
           ('twigs','C  /  CÀNH VỤN','DECAL · cao 0 H · không cản đường'),
           ('broken','D  /  CÀNH GÃY','PROP THẤP CẢN · 0.2 H · 2×1 Sub'),
           ('roots','E  /  RỄ BẬT','PROP THẤP CẢN · 0.45 H · 2×2 Sub'),
           ('bramble','F  /  BỤI GAI','PROP THẤP CẢN · 0.5 H · 2×2 Sub')]
    for i,(name,title,desc) in enumerate(items):
        col=i%3;row=i//3;x=65+col*580;y=215+row*430;cx=x+242;cy=y+236
        stroke(im,[(x,y+398),(x+514,y+398)],RULE)
        ground(im,cx,cy,205,seed=80+i,grid=True)
        a=debris(name,seed=45+i)
        # Debris height includes its projected ground extent; stated H is elevation.
        hi={'log':90,'pile':105,'twigs':62,'broken':96,'roots':146,'bramble':174}[name]
        paste_asset(im,a,cx,cy,hi,shadow=name!='twigs')
        caption(im,x+10,y+300,title,desc)
        txt(im,(x+10,y+363),'MẶT SÀN / KHÔNG VA CHẠM' if name=='twigs' else 'VA CHẠM Ở PHẦN GỖ ĐẶC / KHÔNG THEO CÀNH MẢNH',13,MUTED)
    txt(im,(75,1080),'Lối chính ≥ 3 Sub. Đặt log và bụi gai ở rìa; dùng decal cành vụn để nối cụm mà không thu hẹp lối.',18,INK)
    im.save(OUT/'02_dry_branches_debris.png')

def sheet3():
    im=board(3,'CÂY CHÁY / BA LỚP THỜI GIAN','Hậu thảm họa kiểu Tristram  ·  Than ngả lam–xám; phần rỗng sâu nhất mới gần đen; không bloom.')
    kinds=['fresh','ash','old'];xs=[310,890,1480]
    titles=['01  /  VỪA CHÁY','02  /  THAN ĐÃ NGUỘI','03  /  VẾT CHÁY CŨ']
    notes=['Khe âm ỉ; ngọn đã tắt.','Bark tách mảng; tro xám lạnh.','Cỏ, rêu quay lại; mất nhánh nhỏ.']
    for i,(kind,x) in enumerate(zip(kinds,xs)):
        txt(im,(x-210,214),titles[i],24,INK,True)
        txt(im,(x-210,252),notes[i],17,MUTED)
        ground(im,x,749,200,120+i,ash=True)
        paste_asset(im,tree('burn',kind,seed=20),x,727,414)
        txt(im,(x-190,798),'2.2 H  /  PROP CAO CẢN  /  2×2 Sub',15,MUTED)
    for x in (584,1168):
        stroke(im,[(x-38,230),(x+30,230)],(111,118,103),2)
        stroke(im,[(x+22,223),(x+30,230),(x+22,237)],(111,118,103),2)
    # An explicit small orange register; core value differs from orange body.
    swatches(im,80,856,['char','deepchar','ash','fire','core'])
    ground(im,260,1028,145,47,True);paste_asset(im,stump('char'),260,1012,88)
    caption(im,85,1060,'A / GỐC THAN','0.35 H · prop thấp cản')
    ground(im,820,1024,210,48,True);paste_asset(im,debris('collapsed','char'),820,1012,94)
    caption(im,610,1060,'B / THÂN SỤP','0.4 H · 3×1 Sub · cản')
    ground(im,1410,1004,195,54,True)
    rr=random.Random(80);d=ImageDraw.Draw(im)
    for _ in range(55):
        x=rr.gauss(1410,58);y=rr.gauss(1004,17);w=rr.randint(3,14)
        d.polygon([(x,y),(x+w,y-2),(x+w*1.5,y+3),(x-3,y+5)],fill=rr.choice([(38,46,50),(77,82,84),(50,58,61)]))
    caption(im,1210,1060,'C / TRO + THAN VỤN','Decal · không cản · không phát sáng')
    im.save(OUT/'03_burned_trees.png')

def sheet4():
    im=board(4,'CÂY GIỮ LỜI / LANDMARK NGUYÊN BẢN','Dark Wood  ·  Cây nghi lễ cổ bị bỏ lại sau chiến tranh; cái thiêng còn dấu, lời thề đã đứt.')
    landmark=tree('landmark',seed=78)
    ground(im,680,977,390,78,grid=True)
    paste_asset(im,landmark,680,935,682)
    place_hero(im,1120,1001,210)
    txt(im,(1034,1032),'HERO / 1 H',16,MUTED)
    txt(im,(82,216),'HAI THÂN ÔM HỐC RỖNG',17,INK)
    lines(im,(82,245),['3.25 H · footprint 3×3 Sub',
                         'Tán khuyết, bất đối xứng.',
                         'Nhịp 1–2 màn hình.'],17)
    # Three material/story detail windows use the actual landmark painting.
    source=landmark.im;ax,ay=landmark.anchor
    details=[((-0.19,-.33),(.16,.16),'01 / THỜI NGUYÊN THỦY','Dấu khắc lời thề đã mòn; không phát sáng.'),
             ((.06,-.53),(.47,.30),'02 / THỜI GIAN','Dây lễ sờn, thẻ gỗ phai; rêu giữ chân rễ.'),
             ((.4,-.57),(.24,.25),'03 / THẢM HỌA GẦN ĐÂY','Cành chặt vội, thẻ rách; vết than đã nguội.')]
    for j,(center,size,title,desc) in enumerate(details):
        x=1320;y=238+j*252
        cx=ax+center[0]*760;cy=ay+center[1]*760
        box=(round(cx-size[0]*380),round(cy-size[1]*380),round(cx+size[0]*380),round(cy+size[1]*380))
        patch=source.crop(box);patch.thumbnail((340,154),Image.Resampling.LANCZOS)
        bg=Image.new('RGB',(365,161),(26,33,29));bg.paste(patch,((365-patch.width)//2,(161-patch.height)//2),patch)
        im.paste(bg,(x,y));stroke(im,[(x,y+162),(x+365,y+162)],RULE)
        txt(im,(x,y+177),title,18,INK)
        txt(im,(x,y+207),desc,15,MUTED)
    lines(im,(85,1035),['Kinh dị 2–3: nghi lễ thất lạc, dấu bạo lực; không cần xác treo để đọc câu chuyện.',
                         'Không sao chép Inifuss. Giữ lối đi ≥ 3 Sub; mờ tán/thân khi che hero.'],17)
    im.save(OUT/'04_landmark_tree.png')

def gray(im):return im.convert('L').convert('RGB')
def value(c):return float(np.dot(rgb(c),[.299,.587,.114])/255*100)

def sheet5():
    im=board(5,'KIỂM TRA ĐỌC HÌNH / 75 px = 1 H','Các mẫu dưới đây hiển thị đúng pixel mục tiêu trong PNG 1800×1200; mở 100% để duyệt, không đo trên thumbnail chat.')
    txt(im,(65,211),'A / TỶ LỆ THẬT + SILHOUETTE ĐEN',21,INK,True)
    specs=[('sapling',1.,150,60,210),('medium',1.8,425,300,300),('tall',2.8,790,630,310),('leaning',1.6,1060,970,280),('landmark',3.25,1480,1280,460)]
    for name,h,x,left,panelwidth in specs:
        a=tree(name,seed=78 if name=='landmark' else 12)
        ground(im,x,538,100,44,grid=True)
        paste_asset(im,a,x,520,75*h)
        place_hero(im,x+86,520)
        txt(im,(x-65,561),f'{h:g} H  /  {round(h*75)} px',16,MUTED)
        # Black swatches on a pale neutral field expose weak forks immediately.
        tile=Image.new('RGB',(panelwidth,294),(128,132,122))
        paste_asset(tile,a,x-left,252,75*h,shadow=False,sil=True)
        place_hero(tile,panelwidth-28,252,75,(0,0,0))
        im.paste(tile,(left,605))
    txt(im,(65,925),'B / BA TẦNG GIÁ TRỊ SÁNG',21,INK,True)
    # Construct a genuinely grayscale 1:1 scene with measured sprite values.
    pane=Image.new('RGB',(590,151),rgb(P['ground']))
    a=tree('medium',seed=12);spr,_,_=paste_asset(pane,a,140,140,130,shadow=False)
    place_hero(pane,270,140,75)
    # Effect core >=70, orange is a darker outer skin; no additive bloom.
    d=ImageDraw.Draw(pane);d.polygon([(390,138),(398,105),(407,120),(414,92),(425,125),(430,138)],fill=rgb(P['fire']))
    d.polygon([(401,137),(407,122),(413,129),(417,116),(423,137)],fill=rgb(P['core']))
    pane=gray(pane);im.paste(pane,(65,968))
    lines(im,(675,970),[f'Đất: V {value(P["ground"]):.1f}  /  cây: V 20–45 (mặt sáng ≤ 50)',
                         f'Hero: V {value(P["hero"]):.1f}  →  ΔV với đất = +{value(P["hero"])-value(P["ground"]):.1f}',
                         f'Lõi than: V {value(P["core"]):.1f}  /  vỏ cam #D9822B: V 57.3',
                         'V = luma Rec.601, chuẩn hóa 0–100.'],16,gap=30)
    txt(im,(1180,925),'C / HERO ĐI SAU CÂY',21,INK,True)
    # Hero remains behind in draw order. Only tree opacity changes on overlap.
    for j,faded in enumerate((False,True)):
        pane=Image.new('RGB',(245,151),rgb(P['ground']))
        a=tree('medium',seed=12)
        # Put the hero directly under the trunk, not beside the crown.
        place_hero(pane,110,143,75)
        paste_asset(pane,a,112,146,140,shadow=False,alpha=.28 if faded else 1)
        if faded:place_hero(pane,110,143,75,outline=True)
        else:
            # Persistent outline is the fallback while opacity transitions.
            h=hero();mask=h.getchannel('A');edge=ImageChops.subtract(mask.filter(ImageFilter.MaxFilter(5)),mask)
            pane.paste(Image.new('RGB',h.size,(175,182,159)),(89,68),edge)
        im.paste(pane,(1180+j*280,963))
        txt(im,(1185+j*280,1086),'VIỀN DỰ PHÒNG' if not faded else 'CÂY 28% + VIỀN HERO',13,INK)
    im.save(OUT/'05_readability_check.png')

def validate():
    report={'generator':'Pillow/NumPy; original, deterministic; no downloads',
            'size':[W,H],'value_formula':'Rec.601 encoded RGB luma / 255 * 100',
            'palette':P,'palette_values':{k:round(value(v),2) for k,v in P.items()},'files':{}}
    for path in sorted(OUT.glob('0[1-5]_*.png')):
        with Image.open(path) as im:im.verify()
        with Image.open(path) as im:
            im.load();assert im.size==(W,H);report['files'][path.name]={'size':list(im.size),'mode':im.mode,'opens':True}
    for name in ['sapling','medium','tall','leaning','landmark']:
        a=tree(name,seed=12);pix=np.array(a.im);m=pix[:,:,3]>240
        v=(pix[:,:,:3]@np.array([.299,.587,.114]))/255*100
        report.setdefault('wood_value_audit',{})[name]={'p05':round(float(np.percentile(v[m],5)),2),
             'p50':round(float(np.percentile(v[m],50)),2),'p95':round(float(np.percentile(v[m],95)),2),
             'fraction_V20_45':round(float(np.mean((v[m]>=20)&(v[m]<=45))),4)}
    a=tree('burn','fresh',20);px=np.array(a.im);m=px[:,:,3]>240
    warm=(px[:,:,0].astype(float)>px[:,:,2]*1.5)&(px[:,:,0]>110)&m
    report['fresh_ember_area_percent']=round(float(warm.sum()/m.sum()*100),3)
    report['hero_height_pixels']=hero().height
    assert report['fresh_ember_area_percent']<5
    assert report['hero_height_pixels']==75
    assert value(P['hero'])-value(P['ground'])>=15
    assert value(P['core'])>=70
    assert len(report['files'])==5
    (OUT/'qa_report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(report,ensure_ascii=False,indent=2))

if __name__=='__main__':
    for fn in [sheet1,sheet2,sheet3,sheet4,sheet5]:
        fn();print(fn.__name__+' saved',flush=True)
    validate()
