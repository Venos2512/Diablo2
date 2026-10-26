from PIL import Image, ImageDraw
import numpy as np
SRC='vC/concept_r5.png'; OUT='vC/concept_r5b.png'
GUIDE='_batch/guides/D03_C_r4.png'
a=np.asarray(Image.open(SRC).convert('RGB')).astype(float)
Hh,W,_=a.shape
L=a.mean(2); bgL=np.median(L[100:140])
BASE=586; HORN=167; HNEW=round((BASE-HORN)/1.40); Y1H=BASE-HNEW
CUT=1670; SHIFT=80
def isbg(px): return np.abs(px.mean(-1)-bgL)<14
# --- 1. remove old 1H dashed line (rows 393..398) where above/below are background
for y in range(392,400):
    for x in range(W):
        if isbg(a[y-5,x]) and isbg(a[y+5,x]):
            a[y,x]=(a[y-5,x]+a[y+5,x])/2
# old 1H label at the right end: wipe x>1990, rows 370..400 (background only area)
a[368:402,1990:]=np.median(a[340:360,1990:].reshape(-1,3),0)
# --- 2. erase drawn H (x 20..168, rows 150..583)
for y in range(170,584):
    ref=np.concatenate([a[y,2:18],a[y,150:166]]) if y<580 else a[y,2:18]
    a[y,18:170]=np.median(ref,0)
# --- 3. widen canvas, shift BACK block right
b=np.zeros((Hh,W+SHIFT,3)); b[:,:CUT]=a[:,:CUT]; b[:,CUT+SHIFT:]=a[:,CUT:]
for y in range(Hh):
    row=a[y]; m=isbg(row)
    b[y,CUT:CUT+SHIFT]=np.median(row[m],0)
# baseline across the gap
for y in range(BASE-3,BASE+4):
    b[y,CUT:CUT+SHIFT]=a[y,1150]
# 1.40H dashes across the gap
for y in range(161,166):
    b[y,CUT:CUT+SHIFT]=b[y,CUT-SHIFT:CUT] if True else 0
im=Image.fromarray(np.clip(b,0,255).astype('uint8'))
W2=W+SHIFT
# --- 4. new 1H dashed line on background only
ink=(73,70,66); arr=np.asarray(im).astype(float)
d=ImageDraw.Draw(im)
x=34
while x<W2-60:
    for xx in range(x,min(x+14,W2-60)):
        for yy in (Y1H,Y1H+1):
            if abs(arr[yy,xx].mean()-bgL)<14: im.putpixel((xx,yy),ink)
    x+=23
from PIL import ImageFont
f=ImageFont.truetype('C:/Windows/Fonts/cambria.ttc',20)
d.text((14,Y1H-4),'1H',font=f,fill=ink,anchor='lb')
# --- 5. new H silhouette (same flat silhouette as the guides), HNEW tall
import importlib.util
sp=importlib.util.spec_from_file_location('mt','E:/Diablo2/ashlar/art/act-02/_batches/monsters/make_act2_templates.py')
mt=importlib.util.module_from_spec(sp); sp.loader.exec_module(mt)
w=round(mt.SIL.width*HNEW/mt.SIL.height)
sil=mt.SIL.resize((w,HNEW),Image.LANCZOS); mask=mt.SIL_MASK.resize((w,HNEW),Image.LANCZOS)
cx=95; im.paste(sil,(cx-w//2,BASE-HNEW),mask)
im.save(OUT); print('H',HNEW,'1H y',Y1H,'size',im.size,'sil',mask.size)
# --- 6. round the cut fingertips with an elliptical cap
im=Image.open(OUT).convert('RGB'); c=np.asarray(im).astype(float)
def cap(xedge, direction, R=18):
    x0 = xedge - direction*R           # column where the cap starts
    col = np.abs(c[200:340, x0].mean(-1)-bgL) > 14
    ys = np.where(col)[0] + 200
    ymid, half = (ys.min()+ys.max())/2, (ys.max()-ys.min())/2
    for x in range(min(x0, xedge), max(x0, xedge)+1):
        t = abs(x - x0)/R
        lim = half*np.sqrt(max(0.0, 1-t*t))
        for y in range(195, 345):
            dist = abs(y-ymid) - lim
            if dist > -1.0:
                bgc = c[y, xedge + direction*25] if abs(c[y, xedge+direction*25].mean()-bgL)<14 else c[190, x]
                w = min(1.0, dist+1.0)
                c[y, x] = c[y, x]*(1-w) + bgc*w
cap(CUT-1, +1)
cap(CUT+SHIFT, -1)
Image.fromarray(np.clip(c,0,255).astype('uint8')).save(OUT); print('capped')
