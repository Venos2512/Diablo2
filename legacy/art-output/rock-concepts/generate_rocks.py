"""Original rock concept sheets. Python 3.10+, Pillow, NumPy only.

Run: python legacy/art-output/rock-concepts/generate_rocks.py
All writes are confined to this script's directory. No downloads or game assets.
Meshes, orthographic z-buffer, mineral fields and drawn damage are original.
"""
from pathlib import Path
import json
import math
import random
import colorsys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

OUT = Path(__file__).resolve().parent
W, H = 1800, 1260
BG = '#1B1F1C'
INK = '#C1BCAB'
MUTED = '#8B9180'
RULE = '#41483B'
GOLD = '#9D8B63'
ACT = {
    1: ['#1B1F1C', '#3E4638', '#6F6F5C', '#D9822B', '#6E1414'],
    2: ['#2A1E14', '#8A6A42', '#CDB07A', '#F2D59A', '#5B3C8C'],
    3: ['#141C14', '#34452A', '#6A7A4C', '#E0A040', '#7FA04A'],
    4: ['#120808', '#3A1A12', '#6A3A22', '#FF6A1A', '#8FB4D9'],
    5: ['#1C2228', '#5E6A72', '#C8D2D8', '#E8913A', '#6FD0C8'],
}
U = np.array([2**-.5, -2**-.5, 0.])
# Azimuth 45°, elevation 30° gives projected X/Y ground slopes exactly ±1/2.
V = np.array([-1/np.sqrt(8), -1/np.sqrt(8), np.sqrt(3)/2])
D = -np.cross(U, V)
LIGHT = np.array([-.3, .9, 1.6]); LIGHT /= np.linalg.norm(LIGHT)
CACHE = {}
REPORT = {}


def rgb(s):
    if isinstance(s, str):
        return tuple(int(s[i:i+2], 16) for i in (1, 3, 5))
    return tuple(s)


def mix(a, b, t):
    return tuple(round(x*(1-t)+y*t) for x, y in zip(rgb(a), rgb(b)))


def font(size, serif=False, bold=False):
    # Times includes the full Vietnamese uppercase range; Georgia here does not.
    name = ('timesbd' if bold else 'times') if serif else ('segoeuib' if bold else 'segoeui')
    return ImageFont.truetype('C:/Windows/Fonts/'+name+'.ttf', size)


def text(im, xy, s, size=22, fill=INK, serif=False, bold=False):
    ImageDraw.Draw(im).text(xy, s, fill=fill, font=font(size, serif, bold))


def line(im, points, color=RULE, width=1):
    ImageDraw.Draw(im).line(points, fill=color, width=width, joint='curve')


def sheet(number, title, sub):
    yy, xx = np.mgrid[:H, :W]
    # A restrained, low-contrast vignette, no simulated bloom.
    q = np.clip(1-((xx-W*.46)/(W*.8))**2-((yy-H*.4)/(H*1.2))**2, 0, 1)
    a = np.array(rgb(BG))[None, None, :] + (q[..., None]-1)*5
    im = Image.fromarray(np.uint8(a))
    text(im, (58, 35), 'SANCTUARY  /  ENVIRONMENT STUDIES', 16, MUTED)
    text(im, (58, 70), title, 43, INK, serif=True)
    text(im, (60, 132), sub, 21, MUTED)
    line(im, [(60, 181), (1740, 181)], GOLD)
    text(im, (60, 1215), f'{number:02d}  /  ROCKS • TẢNG ĐÁ     |     ORIGINAL DESIGN     |     1 H = 75 px', 16, MUTED)
    text(im, (1285, 1215), 'ISO 2:1   •   SÁNG TRÊN-TRÁI   •   NO BLOOM', 16, MUTED)
    return im


def signpow(x, p):
    return np.sign(x)*np.abs(x)**p


def mesh(kind='boulder', seed=17):
    # Rounded superellipsoids: broad masses with weathered shoulders, no shards.
    nt, np_ = 39, 64
    theta = np.linspace(-np.pi/2, np.pi/2, nt)
    phi = np.linspace(0, 2*np.pi, np_, endpoint=False)
    t, p = np.meshgrid(theta, phi, indexing='ij')
    specs = {
        'boulder': (1.12, .88, .83, .43, .48),
        'low': (1.18, .92, .35, .48, .55),
        'tall': (.76, .66, 1.52, .40, .50),
        'cliff': (1.5, 1.02, 1.18, .39, .61),
        'standing': (.46, .39, 1.42, .28, .39),
        'pebble': (1., .77, .43, .68, .80),
    }
    ax, ay, az, e1, e2 = specs[kind]
    phase = seed*.371
    rad = 1+.055*np.sin(3*p+phase)*np.cos(t)**2+.037*np.sin(5*p-2*t+phase)
    x = ax*signpow(np.cos(t), e1)*signpow(np.cos(p), e2)*rad
    y = ay*signpow(np.cos(t), e1)*signpow(np.sin(p), e2)*rad
    z = az*signpow(np.sin(t), e1)
    if kind != 'pebble':
        # Large old fracture planes; soft shoulders remain around their ends.
        q=np.stack([x/ax,y/ay,z/az],-1)
        planes=[([.75,.57,.31],1.05),([-.68,.63,.38],1.08),
                ([.48,-.71,.51],1.09),([-.52,-.67,-.46],1.11),
                ([.27,.73,-.62],1.10)]
        for axis,cut in planes:
            axis=np.array(axis);axis/=np.linalg.norm(axis)
            excess=np.maximum(0,q@axis-cut)
            q-=excess[...,None]*axis*.94
        x,y,z=q[...,0]*ax,q[...,1]*ay,q[...,2]*az
    z += .072*np.sin(p*3+phase)*np.cos(t)**2
    x += .12*z + .06*np.sin(z*2+phase)
    y += .045*np.sin(z*3+phase)
    if kind == 'cliff':
        x += .14*np.sin(z*3.1)
        y += .10*np.sin(z*4.3+1)
        # A weathered ledge above a recessed cliff wall, not a scaled boulder.
        y=np.minimum(y,ay*(.50+.20*np.tanh((z-az)*4)))
    if kind == 'standing':
        # One subsided shoulder; each pillar still reads as cut, ancient stone.
        z -= .10*np.maximum(0, np.sin(p+phase))*np.maximum(0, np.sin(t))
        x += .05*np.sin(t*3+phase)
    z -= z.min()
    verts = np.stack([x, y, z], -1).reshape(-1, 3)
    faces = []
    for i in range(nt-1):
        for j in range(np_):
            a, b = i*np_+j, i*np_+(j+1)%np_
            c, d = a+np_, b+np_
            faces.extend([(a, c, b), (b, c, d)])
    faces = np.array(faces)
    fn = np.cross(verts[faces[:, 1]]-verts[faces[:, 0]], verts[faces[:, 2]]-verts[faces[:, 0]])
    center = verts.mean(0)
    inward = np.sum(fn*(verts[faces].mean(1)-center), axis=1)<0
    fn[inward] *= -1
    normals = np.zeros_like(verts)
    for k in range(3):
        np.add.at(normals, faces[:, k], fn)
    normals /= np.maximum(1e-8, np.linalg.norm(normals, axis=1))[:, None]
    return verts, faces, normals


def fields(kind, seed):
    key = kind, seed
    if key in CACHE:
        return CACHE[key]
    verts, faces, normals = mesh(kind, seed)
    pr = np.stack([verts@U, -(verts@V)], -1)
    lo, hi = pr.min(0), pr.max(0)
    scale = 470/(hi[1]-lo[1])
    pad = 14
    size = (int(np.ceil((hi[0]-lo[0])*scale))+pad*2, 498)
    pr = (pr-lo)*scale+pad
    depth = verts@D
    zbuf = np.full((size[1], size[0]), -np.inf)
    posbuf = np.zeros((size[1], size[0], 3), np.float32)
    nbuf = np.zeros_like(posbuf)
    for face in faces:
        pp = pr[face]
        x0, y0 = np.floor(pp.min(0)).astype(int)
        x1, y1 = np.ceil(pp.max(0)).astype(int)
        x0, y0 = max(0, x0), max(0, y0)
        x1, y1 = min(size[0]-1, x1), min(size[1]-1, y1)
        if x1<x0 or y1<y0:
            continue
        yy, xx = np.mgrid[y0:y1+1, x0:x1+1]
        a, b, c = pp
        den = (b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
        if abs(den)<1e-8:
            continue
        wa = ((b[1]-c[1])*(xx-c[0])+(c[0]-b[0])*(yy-c[1]))/den
        wb = ((c[1]-a[1])*(xx-c[0])+(a[0]-c[0])*(yy-c[1]))/den
        wc = 1-wa-wb
        bary = np.stack([wa, wb, wc], -1)
        zz = bary@depth[face]
        sub = zbuf[y0:y1+1, x0:x1+1]
        active = (bary.min(-1)>=-.001)&(zz>sub)
        sub[active] = zz[active]
        pb, nb = bary@verts[face], bary@normals[face]
        posbuf[y0:y1+1, x0:x1+1][active] = pb[active]
        nbuf[y0:y1+1, x0:x1+1][active] = nb[active]
    mask = np.isfinite(zbuf)
    nbuf /= np.maximum(np.linalg.norm(nbuf, axis=-1, keepdims=True), 1e-6)
    data = size, posbuf, nbuf, mask
    CACHE[key] = data
    return data


def mineral(x, y, z, seed):
    # Broad continuous material variation, never per-pixel speckle/grunge.
    f = seed*.23
    return (.48*np.sin(4*x+2.1*y+3*z+f)*np.cos(2.7*y-1.8*z)
            +.28*np.sin(10*x-6*y+7*z+f)*np.sin(5*z+3*y)
            +.13*np.sin(21*x+12*y-15*z)*np.sin(14*z-8*y+f))


def stone_noise(x,y,z,frequency,seed):
    """Smooth 3D mineral patches; no repeating sine-grain or pixel noise."""
    grid=np.random.default_rng(seed).uniform(-1,1,(48,48,48))
    coords=[v*frequency+20 for v in (x,y,z)]
    bases=[np.floor(v).astype(int) for v in coords]
    frac=[v-b for v,b in zip(coords,bases)]
    weights=[v*v*(3-2*v) for v in frac]
    result=np.zeros_like(x)
    for i in range(2):
        for j in range(2):
            for k in range(2):
                val=grid[(bases[0]+i)%48,(bases[1]+j)%48,(bases[2]+k)%48]
                result+=val*(weights[0] if i else 1-weights[0])*(weights[1] if j else 1-weights[1])*(weights[2] if k else 1-weights[2])
    return result


def cap_saturation(a, maximum=.35):
    high = a.max(-1, keepdims=True)
    low = a.min(-1, keepdims=True)
    spread = high-low
    # Move toward achromatic max while preserving the hue relationship.
    k = np.minimum(1., high*maximum/np.maximum(spread, 1e-5))
    return high-(high-a)*k


def clamp_value(a, minimum=20., maximum=44.5):
    lum = a@np.array([.299, .587, .114])
    target = np.clip(lum, minimum*2.55, maximum*2.55)
    return np.clip(a*(target/np.maximum(lum, 1e-5))[..., None], 0, 255)


def rock(kind='boulder', act=1, seed=17, damage=False, rune=False):
    size, pos, norm, mask = fields(kind, seed)
    x, y, z = pos.transpose(2, 0, 1)
    hi = z[mask].max()
    n = stone_noise(x,y,z,2.5,seed)*.8+stone_noise(x,y,z,5.,seed+71)*.2
    facing = np.clip(norm@LIGHT, 0, 1)
    facing = facing*.76+.09+np.clip(norm[..., 2], 0, 1)*.11
    # Three close material values with broad, eroded transitions.
    tone = np.clip(facing*.82+.09+n*.10, 0, 1)
    pal = ACT[act]
    low, high = np.array(rgb(pal[1])), np.array(rgb(pal[2]))
    if act == 1:
        low = np.array(mix('#3E4638', '#5A5040', .32))
    elif act == 4:
        low = np.array([49, 42, 39]); high = np.array(mix(pal[2], '#7B7770', .55))
    a = low[None, None, :]*(1-tone[..., None])+high[None, None, :]*tone[..., None]
    grain=stone_noise(x,y,z,6.,seed+200)
    a += (n*13+grain*5)[..., None]
    # Broad oxide/mineral plates and weathered relief, no pixel noise.
    strata=stone_noise(x,y,z,1.2,seed+53)
    a += (strata*4)[...,None]
    if act == 1:
        oxide=np.clip(n*.7+.15,0,.5)
        a=a*(1-oxide[...,None])+np.array(rgb('#5A5040'))*oxide[...,None]
    if act in (1, 3):
        # Moisture collects at the foot; moss follows stone cavities, not a rim.
        moss = ((z/hi)<(.15+.055*np.sin(x*7+y*4))) & (n>-.19)
        moss_tone = .46+facing*.35+n*.16
        moss_rgb = np.array(rgb('#505A3F' if act==1 else '#56684A'))
        a[moss] = moss_rgb*(moss_tone[moss, None]+.20)+grain[moss,None]*2
    if act == 2:
        # Sandstone bedding, not random scratches.
        bands = np.sin(z*18+x*.65+y*.6)
        a += ((np.maximum(0, bands-.60))*-19)[..., None]
    if act == 3:
        # Broad dark damp streaks, matte stone; no specular hot spots.
        damp = np.maximum(0, np.sin(x*12-y*4+z*2)-.45)
        a *= (1-damp[..., None]*.22)
    if act == 4:
        a *= .71  # Charcoal basalt mass, leaving lava as the sole local light.
    if act == 5:
        snow = (norm[..., 2]>.45) & (z/hi>.48+n*.12)
        snow_tone = .73+.23*facing+n*.04
        a[snow] = np.array(rgb('#C8D2D8'))*snow_tone[snow, None]
        frost = (z/hi>.24)&(norm[..., 0]<-.35)&(n>.30)
        a[frost] = a[frost]*.60+np.array(rgb('#9CAFB8'))*.40
    a = cap_saturation(a)
    if act == 1:
        a = clamp_value(a)
    im = Image.fromarray(np.uint8(np.clip(a, 0, 255))).convert('RGBA')
    alpha = Image.fromarray(np.uint8(mask)*255)
    im.putalpha(alpha)
    # Draw only a few large original fissures, clipped to the actual rock face.
    overlay = Image.new('RGBA', size)
    od = ImageDraw.Draw(overlay)
    sx, sy = size[0], size[1]
    def path(coords):
        return [(int(u*sx), int(v*sy)) for u, v in coords]
    cracks = [
        [( .22,.26),(.36,.35),(.44,.37),(.48,.50),(.57,.55),(.60,.74)],
        [(.48,.50),(.37,.56),(.31,.68)],
        [(.67,.23),(.64,.31),(.70,.37)],
    ]
    if kind == 'standing':
        cracks = [[(.17,.23),(.31,.32),(.42,.34),(.50,.43)],
                  [(.72,.60),(.61,.67),(.64,.86)]]
    if kind == 'cliff':
        cracks += [[(.08,.53),(.29,.50),(.42,.56),(.54,.54),(.79,.61),(.96,.60)]]
    for k, coords in enumerate(cracks):
        pts = path(coords)
        width = 12 if k == 0 else 8
        if kind == 'pebble':
            continue
        rr=random.Random(seed*37+k)
        # Tapered fissure wedges with irregular shoulders, not uniform ink lines.
        mids=[]
        for i in range(len(pts)-1):
            p0,p1=pts[i],pts[i+1]
            for j in range(3):
                t=j/3
                mids.append((p0[0]*(1-t)+p1[0]*t+rr.uniform(-2,2),p0[1]*(1-t)+p1[1]*t+rr.uniform(-2,2)))
        mids.append(pts[-1])
        left=[];right=[]
        for i,(px,py) in enumerate(mids):
            before=np.array(mids[max(0,i-1)]);after=np.array(mids[min(len(mids)-1,i+1)])
            delta=after-before;delta=delta/max(1,np.linalg.norm(delta))
            normal=np.array([-delta[1],delta[0]])
            wid=width*.5*(.35+.65*math.sin(math.pi*(i+.5)/len(mids)))*rr.uniform(.7,1.2)
            left.append(tuple(np.array([px,py])+normal*wid))
            right.append(tuple(np.array([px,py])-normal*wid))
        od.line([(px-2,py+3) for px,py in mids],fill=(*mix(pal[1],pal[2],.65),150),width=width+3,joint='curve')
        od.polygon(left+right[::-1],fill=(*rgb('#333B35' if act==1 else pal[0]),240))
    if damage:
        # Just two story marks: a failed old splitting attempt and dried blood.
        for dx in (0, .055):
            pp = path([(.32+dx,.70),(.37+dx,.64),(.40+dx,.65)])
            od.line([(px-2, py-2) for px, py in pp], fill=(103,103,84,200), width=7)
            od.line(pp, fill=(54,55,48,240), width=6)
        od.polygon(path([(.64,.50),(.70,.52),(.74,.59),(.71,.63),(.69,.59),(.67,.68),(.65,.60)]), fill=(*mix('#6E1414','#5A5040',.25),210))
    if act == 3:
        # Thick root/vine with a few broad leaves, confined to the base mesh.
        pp = path([(.71,.27),(.62,.36),(.66,.51),(.58,.64),(.59,.82),(.48,.90)])
        od.line(pp, fill=(36,43,32,255), width=17, joint='curve')
        od.line([(px-3,py-1) for px,py in pp], fill=(80,87,58,255), width=8, joint='curve')
        for u,v in [(.62,.38),(.63,.54),(.58,.73)]:
            od.polygon(path([(u,v),(u-.09,v-.035),(u-.10,v+.015),(u-.04,v+.04)]), fill=(67,81,52,255))
    if act == 4:
        for coords in cracks[:2]:
            pp = path(coords)
            od.line(pp, fill=(112,43,24,255), width=13, joint='curve')
            od.line(pp, fill=(*rgb('#FF6A1A'),255), width=5, joint='curve')
            # Emission is a narrow lava seam; no blur layer or bloom.
    if rune:
        # Original split-gate glyphs; no Blizzard rune alphabet or symbols.
        for k in range(2):
            cx, cy = .43+.08*k, .46+.18*k
            pp = path([(cx-.11,cy-.045),(cx,cy-.085),(cx+.09,cy-.04),
                       (cx+.02,cy+.035),(cx+.02,cy+.09)])
            od.line([(px-2,py+3) for px,py in pp], fill=(104,102,84,200), width=10, joint='curve')
            od.line(pp, fill=(48,45,39,255), width=9, joint='curve')
            if seed % 2:
                od.line(pp[1:4], fill=(118,43,37,255), width=4, joint='curve')
    overlay.putalpha(ImageChops.multiply(overlay.getchannel('A'), alpha))
    im = Image.alpha_composite(im, overlay)
    aa = np.asarray(im).copy()
    values=aa[...,:3].astype(float)
    # Pigment blood/red runes and emitting lava are the only saturated exceptions.
    exception=(values[...,0]>values[...,1]*1.4)&(values[...,0]>values[...,2]*1.4)
    limited=cap_saturation(values)
    values=np.where(exception[...,None],values,limited)
    if act == 1:
        values=clamp_value(values)
        if damage or rune:
            key='blood_smear' if damage else 'red_rune_'+str(seed)
            REPORT.setdefault('accent_area_percent',{})[key]=round(float((exception&mask).sum()/mask.sum()*100),3)
            assert (exception&mask).sum()/mask.sum()<=.05
    aa[...,:3]=np.uint8(values)
    im=Image.fromarray(aa)
    result=im.crop(alpha.getbbox())
    result.info['rock_act']=act
    return result


def resize_height(im, h):
    result=im.resize((round(im.width*h/im.height), h), Image.Resampling.LANCZOS)
    # Lanczos ringing can overshoot RGB by several points at a dark fissure.
    # Enforce the material range after final resampling, preserving alpha.
    if im.info.get('rock_act')==1:
        a=np.asarray(result).copy()
        a[...,:3]=np.uint8(clamp_value(a[...,:3].astype(float),20.4,44.3))
        result=Image.fromarray(a)
    if im.info.get('hero'):
        a=np.asarray(result).copy()
        a[...,:3]=np.uint8(clamp_value(a[...,:3].astype(float),61.2,64.8))
        result=Image.fromarray(a)
    return result


def shadow(im, cx, foot, width, height, strength=105):
    lay = Image.new('RGBA', im.size)
    d = ImageDraw.Draw(lay)
    # Project away from upper-left light to the lower right.
    d.ellipse((cx-width*.43,foot-height*.21,cx+width*.92,foot+height*.52), fill=(6,12,11,strength))
    lay = lay.filter(ImageFilter.GaussianBlur(max(1, height*.10)))
    im.paste(Image.alpha_composite(im.convert('RGBA'), lay).convert('RGB'))
    lay = Image.new('RGBA', im.size)
    ImageDraw.Draw(lay).ellipse((cx-width*.40, foot-height*.14, cx+width*.40, foot+height*.13), fill=(9,15,13,165))
    lay = lay.filter(ImageFilter.GaussianBlur(max(.6,height*.045)))
    im.paste(Image.alpha_composite(im.convert('RGBA'), lay).convert('RGB'))


def place(im, asset, cx, foot, h, shadows=True):
    a = resize_height(asset, h)
    if shadows:
        shadow(im, cx, foot-3, a.width*.87, max(12,a.height*.20))
    xy = (round(cx-a.width/2), round(foot-a.height))
    im.paste(a, xy, a)
    return a, xy


def ground(im, cx, cy, w, h, act=1, seed=1):
    rng = random.Random(seed)
    lay = Image.new('RGBA', im.size)
    d = ImageDraw.Draw(lay)
    pts=[]
    for k in range(48):
        ang=k/48*math.tau
        rr=rng.uniform(.91,1.04)
        pts.append((cx+math.cos(ang)*w*.5*rr,cy+math.sin(ang)*h*.5*rr))
    col = ['#353B30','#5C5041','#303C2B','#302623','#56616A'][act-1]
    d.polygon(pts, fill=(*rgb(col),160))
    lay=lay.filter(ImageFilter.GaussianBlur(12))
    im.paste(Image.alpha_composite(im.convert('RGBA'),lay).convert('RGB'))
    # Sparse, grouped earth and grass strokes. These are ground, not rock noise.
    d=ImageDraw.Draw(im)
    for _ in range(int(w*h/800)):
        x=cx+rng.uniform(-.45,.45)*w
        y=cy+rng.uniform(-.40,.40)*h
        if ((x-cx)/(w*.47))**2+((y-cy)/(h*.44))**2>1:
            continue
        color=mix(col,BG,rng.uniform(.25,.60))
        d.line((x,y,x+rng.uniform(5,15),y-rng.uniform(0,4)),fill=color,width=rng.choice([2,3]))


def leader(im, pts, label, xy, size=18):
    line(im, pts, MUTED)
    d=ImageDraw.Draw(im)
    x,y=pts[0];d.ellipse((x-3,y-3,x+3,y+3),fill=GOLD)
    text(im,xy,label,size,MUTED)


def swatches(im, x,y, colors, width=68, labels=True):
    d=ImageDraw.Draw(im)
    for k,c in enumerate(colors):
        xx=x+k*(width+12)
        d.rectangle((xx,y,xx+width,y+22),fill=c)
        if labels:
            text(im,(xx,y+30),c,14,MUTED)


def scale_bar(im,x,foot,h=75,label='1 H'):
    line(im,[(x,foot-h),(x,foot)],GOLD)
    line(im,[(x-5,foot-h),(x+5,foot-h)],GOLD)
    line(im,[(x-5,foot),(x+5,foot)],GOLD)
    text(im,(x+10,foot-h//2-12),label,16,MUTED)


def hero(h=75):
    # Near-real human proportions; exact head-to-foot extent, no tall weapon.
    s=4
    a=Image.new('RGBA',(41*s,75*s))
    d=ImageDraw.Draw(a)
    def poly(p,c): d.polygon([(round(x*s),round(y*s)) for x,y in p],fill=c)
    poly([(17,0),(24,0),(26,5),(25,10),(21,13),(16,10),(15,4)],'#A6A591')
    poly([(15,13),(24,12),(31,20),(28,37),(25,43),(15,42),(12,27),(7,30),(6,25),(10,17)],'#9E9D8A')
    poly([(14,38),(26,38),(29,50),(26,61),(28,74),(21,74),(19,61),(19,49),(16,60),(15,74),(8,74),(10,60),(10,48)],'#999C8C')
    poly([(27,20),(32,23),(34,38),(30,46),(27,42),(28,31)],'#A0A18F')
    poly([(8,25),(3,30),(4,46),(11,50),(15,42),(14,29)],'#A3A38E')
    poly([(14,15),(18,15),(17,35),(14,34)],'#AAA995')
    a=a.resize((41,h),Image.Resampling.LANCZOS) if h==75 else a.resize((round(41*h/75),h),Image.Resampling.LANCZOS)
    ar=np.asarray(a).copy()
    ar[...,:3]=np.uint8(clamp_value(ar[...,:3].astype(float),61.2,64.8))
    a=Image.fromarray(ar)
    a.info['hero']=True
    return a


def pebbles(im,cx,foot,scale=1,shadows=True):
    arr=[]
    for dx,dy,hh,seed in [(-32,-2,8,4),(-8,-14,11,9),(17,-1,7,14),(36,6,10,25),(0,16,6,32)]:
        a,xy=place(im,rock('pebble',seed=seed),cx+dx*scale,foot+dy*scale,round(hh*scale),shadows)
        arr.append((a,xy))
    return arr


def family():
    im=sheet(1,'ACT I  /  ĐÁ ĐỒNG HOANG','Nghiên cứu phóng lớn riêng từng mẫu; xem sheet 04 để so tỷ lệ 1:1 trong game.')
    # Row one: three low-to-medium categories with honest H labels.
    labels=[('A  /  ĐÁ VỤN','Decal • 0.04–0.15 H • không cản đường'),
            ('B  /  ĐÁ THẤP','0.40 H • ≤ 0.5 H • vai đá chìm trong đất'),
            ('C  /  TẢNG VỪA','1.00 H • prop cản đường • 2–3 mảng value')]
    for x,(title,sub) in zip((60,625,1190),labels):
        text(im,(x,210),title,25,INK,serif=True)
        text(im,(x,253),sub,18,MUTED)
    for cx in (300,855,1420):ground(im,cx,467,470,155,seed=int(cx))
    pebbles(im,300,437,3.5)
    place(im,rock('low',seed=21),855,485,150)
    place(im,rock('boulder',seed=17,damage=True),1420,535,220)
    leader(im,[(1462,465),(1570,510),(1660,510)],'Vết máu khô rất nhỏ', (1467,546),17)
    line(im,[(60,585),(1740,585)],RULE)
    text(im,(60,620),'D  /  TẢNG CAO',25,INK,serif=True)
    text(im,(60,661),'2.20 H • họ biến thể 1.5–3 H • bóng tiếp xúc rõ',18,MUTED)
    text(im,(925,620),'E  /  MẢNG MÉP VÁCH',25,INK,serif=True)
    text(im,(925,661),'2.40 H • ranh giới tự nhiên • khối đá theo lớp',18,MUTED)
    ground(im,430,1088,670,165,seed=23)
    place(im,rock('tall',seed=12),430,1095,390)
    place(im,hero(),745,1100,177,False)
    scale_bar(im,790,1100,177,'1 H')
    ground(im,1300,1090,800,190,seed=29)
    place(im,rock('cliff',seed=19),1280,1100,385)
    leader(im,[(1170,1048),(1060,1118),(953,1118)],'Rêu sát chân / cạnh đã mòn', (958,1131),17)
    swatches(im,60,1140,[BG,'#3E4638','#6F6F5C','#5A5040','#555248','#6E1414'],70)
    text(im,(660,1150),'Moor → Stony Field → Tamoe  |  Máu là dấu vết, không phải màu trang trí.',18,MUTED)
    im.save(OUT/'01_act1_rock_family.png')
    return im


def cairn():
    im=sheet(2,'LANDMARK  /  VÒNG ĐÁ LỜI THỀ GÃY','Sáu trụ cổ nguyên bản, một vai trụ bị lún; khoảng rỗng ở tâm giúp đọc landmark từ xa.')
    ground(im,675,820,1110,460,seed=77)
    # Rear stones first; irregular six-part plan deliberately differs from D2.
    stones=[(385,661,344,10),(670,610,375,13),(951,699,324,18),
            (318,858,358,20),(1000,906,395,25),(640,1020,315,29)]
    for cx,foot,hh,seed in stones:
        place(im,rock('standing',seed=seed,rune=True),cx,foot,hh)
    pebbles(im,453,945,2.0)
    place(im,hero(),1100,1044,143,False)
    scale_bar(im,1150,1044,143,'1 H')
    # Capture clean art before drawing editorial leaders over it.
    thumb=im.crop((165,210,1195,1060)).resize((400,330),Image.Resampling.LANCZOS)
    leader(im,[(708,529),(1095,360),(1215,360)],'Mặt khắc cũ / rãnh chữ đã mòn',(1227,344),18)
    leader(im,[(351,785),(182,1025),(64,1025)],'Chân chôn sâu; rêu theo ẩm',(60,1050),18)
    text(im,(70,1110),'2.1–2.8 H mỗi trụ  •  vòng rộng ~7 H  •  không sao chép rune/biểu tượng Blizzard',19,MUTED)
    line(im,[(1260,406),(1260,1160)],RULE)
    text(im,(1310,424),'CẤU TRÚC LANDMARK',24,INK,serif=True)
    text(im,(1310,466),'Trật tự cũ → thời gian → tha hóa',19,MUTED)
    for k,s in enumerate(['01  Sáu trụ giữ một tâm rỗng.',
                          '02  Khối cao, nặng; vai không đều.',
                          '03  Rêu và nứt lớn ở chân.',
                          '04  Đỏ chỉ nằm trong vài rãnh.',
                          '05  Không cột sáng, không bloom.']):
        text(im,(1310,510+k*38),s,18,MUTED)
    text(im,(1310,737),'NHÌN XA  /  HERO ~56 px',19,INK)
    im.paste(thumb,(1310,775))
    swatches(im,1310,1130,['#5A5040','#6F6F5C','#3E4638','#6E1414'],76)
    im.save(OUT/'02_cairn_landmark.png')
    return im


def variants():
    im=sheet(3,'CÙNG MỘT KHỐI ĐÁ  /  NĂM ACT','Khóa silhouette và camera; nhận diện vùng bằng vật liệu, độ ẩm, trầm tích và lớp phủ.')
    names=['I  /  MOOR','II  /  SA MẠC','III  /  RỪNG ẨM','IV  /  ĐỊA NGỤC','V  /  BĂNG TUYẾT']
    materials=[['Rêu ôm chân; đá nâu-xám.','Nứt rộng, cạnh đã mòn.'],
               ['Sa thạch có lớp trầm tích.','Cát bào mòn vai và khe.'],
               ['Đá sẫm ẩm, dây leo dày.','Ướt bằng value; không bóng.'],
               ['Basalt nặng, ám đỏ-nâu.','Dung nham chỉ trong khe.'],
               ['Granite xám lạnh; tuyết bẩn.','Sương giá ở mặt hứng gió.']]
    assets=[]
    for k in range(5):
        act=k+1;x=60+342*k;cx=x+160
        if k:line(im,[(x-14,218),(x-14,1156)],RULE)
        text(im,(x,221),names[k],24,INK,serif=True)
        text(im,(x,266),'1.20 H  /  CÙNG MESH #17',17,MUTED)
        ground(im,cx,660,315,155,act=act,seed=17)
        a=rock('boulder',act=act,seed=17)
        assets.append(a)
        place(im,a,cx,654,230)
        text(im,(x,735),materials[k][0],19,MUTED)
        text(im,(x,773),materials[k][1],19,MUTED)
        swatches(im,x,842,ACT[act][:3],88)
        text(im,(x,927),'NGUỒN / KẺ LẠ • CH.04',15,MUTED)
        swatches(im,x,963,ACT[act][3:],88)
    line(im,[(60,1076),(1740,1076)],GOLD)
    text(im,(60,1100),'CÁCH DÙNG MÀU',20,INK)
    text(im,(335,1099),'Swatch là màu khóa AD; mặt đá là màu đã nhận sáng và khử bão hòa (S ≤ 35%).',21,MUTED)
    text(im,(335,1141),'Act II / V: cho phép nền sáng, hero tối tương phản. Act IV: khe dung nham là nguồn sáng cục bộ.',19,MUTED)
    assert all(np.array_equal(np.array(assets[0].getchannel('A')),np.array(a.getchannel('A'))) for a in assets[1:])
    REPORT['variant_silhouette_identical'] = True
    im.save(OUT/'03_act_variants.png')
    return im


def scene_game():
    im=Image.new('RGB',(540,560),'#343A30')
    # Low contrast ground value around 20–23, fixed 2:1 floor guides.
    yy,xx=np.mgrid[:560,:540]
    n=np.sin(xx*.031+yy*.019)*1.3+np.cos(xx*.017-yy*.037)*1.1
    a=np.zeros((560,540,3))
    for k,v in enumerate(rgb('#343A30')):a[...,k]=v+n
    im=Image.fromarray(np.uint8(a))
    for offset in range(-600,650,80):
        line(im,[(offset,0),(offset+1120,560)],'#3A3F33')
        line(im,[(offset,560),(offset+1120,0)],'#3A3F33')
    rm=Image.new('L',im.size)
    hm=Image.new('L',im.size)
    # Spaced so height classes and hero are all visible at once.
    props=[('cliff',19,145,270,180),('tall',12,391,273,165),
           ('boulder',17,137,422,75),('low',21,403,434,30)]
    values=[]
    for kind,seed,cx,foot,h in props:
        asset=rock(kind,seed=seed,damage=(kind=='boulder'))
        aa,xy=place(im,asset,cx,foot,h)
        rm.paste(ImageChops.lighter(rm.crop((xy[0],xy[1],xy[0]+aa.width,xy[1]+aa.height)),aa.getchannel('A')),xy)
        ar=np.array(aa)
        good=ar[...,3]>250
        values.extend(np.array(aa.convert('L'))[good].tolist())
    for aa,xy in pebbles(im,269,478,1):
        rm.paste(aa.getchannel('A'),xy)
        ar=np.array(aa);good=ar[...,3]>250
        values.extend(np.array(aa.convert('L'))[good].tolist())
    aa,xy=place(im,hero(),270,386,75)
    hm.paste(aa.getchannel('A'),xy)
    hv=np.array(aa.convert('L'))[np.array(aa.getchannel('A'))>250]
    rock_min,rock_max=np.min(values)/2.55,np.max(values)/2.55
    hero_min,hero_max=hv.min()/2.55,hv.max()/2.55
    REPORT['readability']={'hero_height_px':75,'rock_value_min':round(rock_min,2),'rock_value_max':round(rock_max,2),
                           'hero_value_min':round(hero_min,2),'hero_value_max':round(hero_max,2),
                           'hero_min_minus_rock_max':round(hero_min-rock_max,2),
                           'value_definition':'Pillow L / 255 × 100; opaque material pixels (alpha > 250), excluding shadows, labels and ground'}
    assert rock_min >= 19.5 and rock_max <=45
    assert hero_min-rock_max >=15
    return im,rm,hm


def readability():
    im=sheet(4,'KIỂM TRA ĐỌC HÌNH  /  1 H = 75 px','Ba cửa sổ cùng vị trí, cùng tỷ lệ 1:1: màu trong game → silhouette → giá trị sáng.')
    game,rm,hm=scene_game()
    both=ImageChops.lighter(rm,hm)
    silhouette=Image.new('RGB',game.size,'#AAA99C')
    silhouette.paste(Image.new('RGB',game.size,'#000000'),(0,0),both)
    grayscale=game.convert('L').convert('RGB')
    for x,panel,title,sub in zip([60,630,1200],[game,silhouette,grayscale],
                                ['A  /  GAME SCALE','B  /  SILHOUETTE','C  /  GRAYSCALE'],
                                ['Camera iso 2:1 • H = 75 px','Tô đen khối • bỏ bóng và texture','Vật liệu đá V20–45 • hero sáng hơn']):
        text(im,(x,215),title,24,INK,serif=True)
        text(im,(x,258),sub,18,MUTED)
        im.paste(panel,(x,303))
        scale_bar(im,x+301,303+386,75,'75 px')
        text(im,(x+15,303+522),'Vụn → 0.40 H → 1 H → 2.20 H → vách 2.40 H',17,INK if x!=630 else '#32372F')
    r=REPORT['readability']
    text(im,(60,902),'ĐO TRÊN PIXEL VẬT LIỆU ĐẶC',23,INK,serif=True)
    text(im,(60,947),f"Đá: V{r['rock_value_min']:.1f}–{r['rock_value_max']:.1f}   |   Hero: V{r['hero_value_min']:.1f}–{r['hero_value_max']:.1f}",24,INK)
    text(im,(60,992),f"Chênh tối thiểu = {r['hero_min_minus_rock_max']:.1f} điểm  ≥  15   •   ĐẠT",25,'#AFB69A')
    text(im,(60,1040),'Đo L = 0.299 R + 0.587 G + 0.114 B, chuẩn hóa 0–100.',19,MUTED)
    text(im,(60,1075),'Bỏ pixel alpha biên, nền, bóng tiếp xúc và chữ khỏi phép đo.',19,MUTED)
    text(im,(1010,902),'DẢI VALUE / KHÔNG TÍNH CHỮ',22,INK,serif=True)
    d=ImageDraw.Draw(im)
    bx,by,bw=1010,960,680
    for k in range(bw):
        c=round(k/(bw-1)*255);d.line((bx+k,by,bx+k,by+48),fill=(c,c,c))
    for val,label in [(20,'20'),(45,'45'),(60,'60'),(65,'65')]:
        xx=bx+bw*val/100
        line(im,[(xx,by+51),(xx,by+72)],GOLD,2)
        text(im,(xx-10,by+78),label,17,MUTED)
    text(im,(1010,1104),'Chi tiết nhận diện ≥ 2 px; đá vụn chỉ giữ khối và màu.',19,MUTED)
    text(im,(1010,1143),'Đây là kiểm tra tĩnh, chưa thay thế test cảnh đông trong engine.',18,MUTED)
    im.save(OUT/'04_readability_check.png')
    return im


def main():
    OUT.mkdir(parents=True,exist_ok=True)
    for fn in [family,cairn,variants,readability]:
        fn(); print('Rendered:',fn.__name__,flush=True)
    # Independently reopen every PNG and force full decompression.
    checks=[]
    for p in sorted(OUT.glob('0[1-4]_*.png')):
        with Image.open(p) as a:
            a.verify()
        with Image.open(p) as a:
            a.load()
            checks.append({'file':p.name,'size':list(a.size),'mode':a.mode,'opens':True})
    REPORT['png_checks']=checks
    assert abs(abs(U[0]/V[0])-2)<1e-9
    REPORT['camera']={'ground_ratio':'2:1','elevation_degrees':30.,'projection':'orthographic','key_light':'upper-left'}
    (OUT/'verification.json').write_text(json.dumps(REPORT,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(REPORT,ensure_ascii=False,indent=2),flush=True)


if __name__=='__main__':
    main()
