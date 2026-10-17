"""Vietnamese countryside at sunset. Reproducible original Pillow illustration."""
from PIL import Image, ImageDraw, ImageFilter
import aggdraw
import random, math
from pathlib import Path

random.seed(71)
W,H=1800,1120
im=Image.new('RGB',(W,H))
d=ImageDraw.Draw(im)
def mix(a,b,t): return tuple(round(x+(y-x)*t) for x,y in zip(a,b))
stops=[(0,(74,113,137)),(.25,(190,160,151)),(.46,(255,204,137)),(.57,(227,189,110)),(1,(55,89,53))]
for y in range(H):
    t=y/H
    for (a,ca),(b,cb) in zip(stops,stops[1:]):
        if a<=t<=b: d.line((0,y,W,y),fill=mix(ca,cb,(t-a)/(b-a))); break
def path(coords,fill,stroke=None,sw=1):
    ctx=aggdraw.Draw(im); p=aggdraw.Path()
    for cmd,v in coords:
        {'M':p.moveto,'L':p.lineto,'C':p.curveto,'Q':None,'Z':p.close}[cmd](*v)
    ctx.path(p,aggdraw.Brush(fill) if fill else None,aggdraw.Pen(stroke,sw) if stroke else None);ctx.flush()
def ellipse(box,c): ImageDraw.Draw(im).ellipse(box,fill=c)
# Luminous sun and a soft peach haze.
glow=Image.new('RGBA',(W,H));gd=ImageDraw.Draw(glow)
for r in range(260,30,-2):
    gd.ellipse((1180-r,363-r,1180+r,363+r),fill=(255,209,133,round(2+14*(1-r/260))))
glow=glow.filter(ImageFilter.GaussianBlur(30)); im=Image.alpha_composite(im.convert('RGBA'),glow).convert('RGB')
ellipse((1129,312,1231,414),'#ffe7aa')
# Layered wisps, with warm undersides.
cloud=Image.new('RGBA',(W,H));cd=ImageDraw.Draw(cloud)
for x,y,ww in [(100,155,550),(700,105,420),(1370,210,500),(300,295,440),(940,246,290)]:
    for i in range(22):
        xx=x+random.uniform(-ww/2,ww/2); yy=y+random.uniform(-15,15)
        cd.ellipse((xx-80,yy-8,xx+130,yy+10),fill=(242,191,162,random.randrange(8,30)))
im=Image.alpha_composite(im.convert('RGBA'),cloud.filter(ImageFilter.GaussianBlur(9))).convert('RGB')
# Atmospheric low hills behind the delta.
path([('M',(0,519)),('C',(140,470,200,480,330,502)),('C',(460,429,510,468,650,500)),('C',(780,449,840,473,960,506)),('C',(1100,451,1160,476,1290,502)),('C',(1450,460,1550,482,1800,465)),('L',(1800,655)),('L',(0,655)),('Z',())],'#9b9d83')
path([('M',(0,554)),('C',(240,506,330,542,520,531)),('C',(730,499,815,541,1020,529)),('C',(1250,507,1440,533,1800,514)),('L',(1800,670)),('L',(0,670)),('Z',())],'#788969')
# Far village tree line, tiny irregular crowns.
for x in range(-10,1820,11):
    y=551+12*math.sin(x/100);r=random.randint(8,24)
    ellipse((x-r,y-r,x+r,y+24),random.choice(['#647d55','#71835a','#7a875a','#889161']))
# Rice paddies, overlapping rounded strips.
path([('M',(0,600)),('C',(550,561,1220,586,1800,574)),('L',(1800,1120)),('L',(0,1120)),('Z',())],'#7c9749')
path([('M',(0,664)),('C',(480,599,1100,616,1800,615)),('L',(1800,736)),('C',(1190,681,540,674,0,773)),('Z',())],'#b4b25a')
path([('M',(0,781)),('C',(520,686,1110,669,1800,730)),('L',(1800,923)),('C',(1020,785,456,795,0,947)),('Z',())],'#d1b65a')
path([('M',(0,955)),('C',(550,793,1190,815,1800,932)),('L',(1800,1120)),('L',(0,1120)),('Z',())],'#8b9d45')
for y,col in [(631,'#899649'),(684,'#758347'),(790,'#697f3e'),(939,'#627b38')]:
    path([('M',(0,y+40)),('C',(500,y-69,1140,y-48,1800,y+18))],None,col,7 if y>700 else 4)
# Thousands of individually lit rice stalks, increasing with perspective.
for i in range(13500):
    y=random.uniform(610,1125);x=random.uniform(0,1800);depth=(y-590)/530
    ln=random.uniform(4,17)*(0.25+depth*1.4)
    col=random.choice(['#d7bd60','#b9b254','#e6c875','#a1a54a','#73883c','#f0d381'])
    if y>955 and random.random()<.4: col='#69813c'
    lean=random.uniform(-6,6)*depth
    dr=ImageDraw.Draw(im);dr.line((x,y,x+lean,y-ln),fill=col,width=1 if depth<.5 else 2)
    if depth>.2 and random.random()<.5:
        dr.line((x+lean,y-ln,x+lean+4*depth,y-ln+3*depth),fill='#e5c679',width=2)
# Narrow water channel reflecting the sunset.
path([('M',(1800,790)),('C',(1510,729,1270,689,1060,659)),('C',(1310,711,1520,788,1800,857)),('Z',())],'#b0b8a0')
for i in range(135):
    t=random.random();x=1070+730*t;y=660+145*t+random.uniform(-6,12)*t
    ImageDraw.Draw(im).line((x,y,x+random.uniform(5,38),y),fill=random.choice(['#e4cc90','#d3ca9d','#849b83']),width=2)
# Winding village lane.
path([('M',(812,588)),('C',(945,630,1164,652,1128,713)),('C',(1103,754,855,779,840,866)),('C',(828,952,1124,1014,1195,1120)),('L',(794,1120)),('C',(752,1008,651,951,683,866)),('C',(718,774,1030,736,1054,701)),('C',(1103,664,901,629,796,593)),('Z',())],'#7c7846')
path([('M',(811,590)),('C',(945,633,1149,653,1111,708)),('C',(1085,752,827,787,808,867)),('C',(790,950,1078,1024,1148,1120)),('L',(835,1120)),('C',(785,1008,692,951,713,867)),('C',(744,783,1050,744,1072,703)),('C',(1120,662,901,628,803,592)),('Z',())],'#c9aa76')
path([('M',(1018,1120)),('C',(941,1008,722,952,757,868)),('C',(792,794,1034,762,1094,711))],None,'#ddbc86',7)
path([('M',(875,1118)),('C',(825,1005,693,945,742,868))],None,'#b99c6b',4)
# Clay tile houses clustered in the middle distance.
def house(x,y,s):
    def poly(pts,c): ImageDraw.Draw(im).polygon([(x+a*s,y+b*s) for a,b in pts],fill=c)
    poly([(0,0),(130,0),(130,80),(0,80)],'#dfc28a')
    poly([(130,0),(169,-15),(169,65),(130,80)],'#a99062')
    poly([(-17,5),(49,-60),(182,-53),(139,8)],'#754c3c')
    poly([(-17,5),(49,-60),(111,-53),(53,8)],'#a76545')
    for j in range(1,9):
        yy=5-j*7
        ImageDraw.Draw(im).line((x+(-17+j*7.3)*s,y+yy*s,x+(139+j*4.7)*s,y+(yy+2)*s),fill='#c18356',width=max(1,int(s*2)))
    for a in [18,93]: poly([(a,26),(a+20,26),(a+20,54),(a,54)],'#565b43')
    poly([(53,24),(79,24),(79,80),(53,80)],'#4a4a35')
    ImageDraw.Draw(im).line((x-7*s,y+81*s,x+137*s,y+81*s),fill='#ede0a5',width=3)
house(604,542,.62);house(416,570,1.06);house(252,585,.75)
# Village bamboo grove, curved stems and pointed foliage.
for i in range(26):
    x=random.uniform(110,220);top=random.uniform(316,465);end=x+random.uniform(-72,70)
    path([('M',(x,626)),('C',(x-6,520,end,410,end,top))],None,random.choice(['#465f43','#526d45','#687d49']),random.uniform(2,5))
    for yy in range(int(top+25),600,32):
        xx=x+(end-x)*(626-yy)/(626-top)
        ImageDraw.Draw(im).line((xx-3,yy,xx+3,yy-1),fill='#a0a063',width=2)
    for j in range(38):
        yy=random.uniform(top,top+160); xx=end+random.uniform(-80,80);sign=random.choice([-1,1]); ln=random.uniform(15,43)
        path([('M',(xx,yy)),('C',(xx+sign*ln*.5,yy-14,xx+sign*ln,yy-16,xx+sign*ln,yy-20)),('C',(xx+sign*ln*.8,yy-4,xx+sign*ln*.3,yy+1,xx,yy)),('Z',())],random.choice(['#3c6046','#507449','#69844d','#839653']))
# Foreground buffalo, facing left: body, jointed legs, ears, muzzle, curved horns.
ellipse((1226,920,1457,945),'#718243')
path([('M',(1271,864)),('C',(1260,826,1319,809,1383,821)),('C',(1442,829,1451,862,1430,892)),('C',(1390,916,1313,907,1271,886)),('Z',())],'#424c46')
path([('M',(1289,879)),('L',(1281,932)),('L',(1296,933)),('L',(1306,887)),('M',(1398,887)),('L',(1409,931)),('L',(1423,931)),('L',(1417,877))],None,'#35433d',12)
path([('M',(1320,886)),('L',(1317,923)),('L',(1325,929)),('M',(1378,889)),('L',(1378,925)),('L',(1387,929))],None,'#536052',8)
path([('M',(1289,854)),('C',(1269,838,1251,843,1245,863)),('L',(1224,885)),('C',(1222,899,1251,907,1264,893)),('L',(1298,878)),('Z',())],'#414d47')
path([('M',(1250,852)),('C',(1225,840,1221,823,1236,811)),('C',(1229,830,1247,839,1260,843))],None,'#c4bc94',6)
path([('M',(1270,849)),('C',(1290,837,1286,822,1280,818))],None,'#d2c39c',5)
path([('M',(1250,861)),('L',(1224,855)),('L',(1238,871)),('Z',())],'#596255')
ellipse((1247,869,1252,874),'#1f302e');ellipse((1226,887,1231,890),'#253731')
path([('M',(1433,849)),('C',(1463,865,1435,901,1461,910))],None,'#3b4940',4)
path([('M',(1461,906)),('L',(1466,920))],None,'#303f36',8)
path([('M',(1304,833)),('C',(1346,819,1394,835,1409,847))],None,'#7b7c62',3)
# Tiny birds over the glowing horizon.
for x,y,s in [(918,335,13),(950,321,10),(985,348,9),(1436,385,7),(1460,377,9)]:
    path([('M',(x-s,y)),('C',(x-s*.6,y-6,x-2,y-4,x,y)),('C',(x+4,y-6,x+s*.6,y-6,x+s,y-3))],None,'#716e61',2)
# A few broad grass blades frame the lower edge.
for i in range(240):
    x=random.choice([random.uniform(0,650),random.uniform(1260,1800)]);y=random.uniform(1084,1140);ln=random.uniform(20,86)
    path([('M',(x,y)),('C',(x-3,y-ln*.4,x+random.uniform(-25,25),y-ln*.8,x+random.uniform(-25,25),y-ln))],None,random.choice(['#4f703c','#6d813d','#a5a052']),random.uniform(1,3))
# Fine paper grain ties the hand-drawn forms together.
noise=Image.effect_noise((W,H),9).convert('RGB')
im=Image.blend(im,noise,.035)
out=Path(__file__).with_name('dong-que.png')
im.save(out,optimize=True)
print(f'{out.resolve()} — {W} x {H}')
