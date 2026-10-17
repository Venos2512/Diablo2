"""Group A: five original procedural gothic-fantasy concept illustrations.
Run: python concepts_a.py. Only the five explicitly named PNGs are written.
Materials are shaded, distressed and hand-designed with Pillow/NumPy.
"""
from pathlib import Path
import math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

OUT = Path(__file__).resolve().parent
W,H,S=1024,1536,2
R=random.Random(76)
NR=np.random.default_rng(76)
im=None
scene=None
silhouette=None
ACC=(105,167,151)

def line(pts,fill,width=2):
    ImageDraw.Draw(im).line([(int(x*S),int(y*S)) for x,y in pts],fill=fill,width=max(1,int(width*S)),joint='curve')

def poly(pts,c,mat='plain',edge=None):
    # Local material shading, masked against hand-drawn silhouettes.
    if silhouette is not None:
        ImageDraw.Draw(silhouette).polygon([(int(x*S),int(y*S)) for x,y in pts],fill=255)
    xs,ys=zip(*pts)
    x0=max(0,int(min(xs))-2); y0=max(0,int(min(ys))-2)
    x1=min(W,int(max(xs))+3); y1=min(H,int(max(ys))+3)
    if x1<=x0 or y1<=y0:return
    bw,bh=(x1-x0)*S,(y1-y0)*S
    mask=Image.new('L',(bw,bh)); md=ImageDraw.Draw(mask)
    pp=[((x-x0)*S,(y-y0)*S) for x,y in pts]
    md.polygon(pp,fill=255)
    yy,xx=np.mgrid[0:bh,0:bw].astype(np.float32)
    xx/=max(1,bw); yy/=max(1,bh)
    noise=NR.normal(0,3.6,(bh,bw))
    shade=.56+.42*(1-xx)+.14*np.sin(xx*7+yy*2)
    if mat=='metal': shade+=.38*np.exp(-((xx-.24)/.07)**2)+.13*np.sin(xx*33)
    if mat=='cloth': shade+=.16*np.sin(xx*36+yy*3)
    if mat=='skin': shade+=.17*np.exp(-((xx-.36)/.22)**2)
    shade+=.025*np.sin(xx*137+np.sin(yy*93)*3)*np.sin(yy*121+xx*17)
    if mat in ('metal','leather','bone'):
        shade+=.055*np.sin(xx*59+yy*23)*np.sin(yy*47-xx*11)
    arr=np.clip(np.array(c)[None,None,:]*shade[:,:,None]+noise[:,:,None],0,255).astype('uint8')
    tex=Image.fromarray(arr)
    td=ImageDraw.Draw(tex)
    if mat in ('metal','leather','bone'):
        for _ in range(max(3,int(bw*bh/3600))):
            x=R.randrange(bw);y=R.randrange(bh);l=R.randint(2,18)*S
            color=tuple(max(0,int(v*.45)) for v in c) if R.random()<.7 else tuple(min(255,int(v*1.4)) for v in c)
            td.line((x,y,x+l,y+R.randint(-6,5)*S),fill=color,width=R.choice([1,1,2]))
        if mat=='metal':
            for _ in range(int(bw*bh/6500)):
                x=R.randrange(bw);y=R.randrange(bh);r=R.randint(1,4)*S
                td.ellipse((x,y,x+r*2,y+r),fill=(67,39,25))
    im.paste(tex,(x0*S,y0*S),mask)
    line(pts+[pts[0]],edge or tuple(int(v*.3) for v in c),1.3)
    if mat in ('metal','bone'):line(pts[:min(4,len(pts))],tuple(min(255,int(v*1.4)) for v in c),1.3)

def ellipse(box,c,outline=None,width=1):
    ImageDraw.Draw(im).ellipse(tuple(int(v*S) for v in box),fill=c,outline=outline,width=max(1,int(width*S)))

def glow(pts,c,width=3,blur=16):
    global im
    layer=Image.new('RGBA',im.size)
    ImageDraw.Draw(layer).line([(int(x*S),int(y*S)) for x,y in pts],fill=(*c,220),width=int(width*S),joint='curve')
    im=Image.alpha_composite(im.convert('RGBA'),layer.filter(ImageFilter.GaussianBlur(blur*S))).convert('RGB')
    line(pts,c,width)
    line(pts,tuple(min(255,int(v*.55+110)) for v in c),max(.6,width*.25))

def orb(x,y,r,c):
    global im
    lay=Image.new('RGBA',im.size)
    ImageDraw.Draw(lay).ellipse(((x-r)*S,(y-r)*S,(x+r)*S,(y+r)*S),fill=(*c,190))
    im=Image.alpha_composite(im.convert('RGBA'),lay.filter(ImageFilter.GaussianBlur(r*.65*S))).convert('RGB')
    ellipse((x-r*.52,y-r*.52,x+r*.52,y+r*.52),tuple(int(v*.7) for v in c))
    ellipse((x-r*.32,y-r*.32,x+r*.32,y+r*.32),c)
    ellipse((x-r*.12,y-r*.15,x+r*.12,y+r*.1),(240,244,220))

def rune(x,y,size=14,c=None):
    c=c or ACC
    line([(x,y-size),(x,y+size),(x+size*.6,y+size*.3),(x-size*.55,y-size*.4),(x,y-size)],c,1.4)
    line([(x-size*.5,y+size*.5),(x+size*.6,y-size*.6)],c,1)

def rivets(pts,c=(156,132,90)):
    for x,y in pts:
        ellipse((x-3,y-3,x+3,y+3),(23,22,19))
        ellipse((x-2,y-2,x+1,y+1),c)

def blood(x,y,scale=1):
    for _ in range(28):
        dx=R.gauss(0,15)*scale;dy=R.gauss(0,25)*scale;r=R.uniform(.8,3)*scale
        ellipse((x+dx,y+dy,x+dx+r,y+dy+r*2),R.choice([(69,17,18),(88,25,21),(46,14,17)]))
    line([(x,y),(x+3*scale,y+30*scale),(x+1*scale,y+48*scale)],(76,20,18),2*scale)

def skull(x,y,s=1):
    def p(a):return [(x+u*s,y+v*s) for u,v in a]
    poly(p([(-30,-28),(-16,-45),(15,-43),(30,-25),(28,1),(17,15),(13,36),(-14,36),(-20,14),(-29,3)]),(154,148,112),'bone')
    poly(p([(-24,-14),(-7,-16),(-5,0),(-19,5),(-25,0)]),(12,18,17))
    poly(p([(7,-16),(24,-14),(25,0),(17,5),(5,0)]),(12,18,17))
    poly(p([(0,-1),(-5,13),(5,12)]),(29,27,20))
    for u in range(-12,15,5):line(p([(u,21),(u,33)]),(40,37,29),max(1,s))
    line(p([(-8,-38),(-3,-29),(-8,-20)]),(54,54,43),s)

def face(x,y,s=1,female=False,beard=False):
    def p(a):return [(x+u*s,y+v*s) for u,v in a]
    poly(p([(-27,-38),(20,-41),(33,-12),(26,28),(9,48),(-10,46),(-29,19),(-33,-10)]),(162,136,113) if female else (139,127,108),'skin')
    poly(p([(-27,-8),(-6,-3),(-13,7),(-25,5)]),(69,64,57))
    poly(p([(5,-3),(26,-8),(23,7),(10,6)]),(54,50,43))
    line(p([(-24,-1),(-12,0)]),(201,193,155),1.2)
    line(p([(10,0),(23,-2)]),(201,193,155),1.2)
    poly(p([(1,-8),(-6,21),(6,23),(9,17)]),(101,83,69))
    line(p([(-9,31),(9,30),(16,26)]),(54,34,32),1.7)
    line(p([(-20,9),(-12,18)]),(196,154,124),1.4)
    if beard:
        poly(p([(-29,12),(-14,28),(1,24),(16,26),(28,9),(25,49),(6,78),(-17,55)]),(62,57,48),'cloth')
        for i in range(18):
            u=R.uniform(-23,23);line(p([(u,30),(u*.5+3,61+R.uniform(-5,7))]),(103,93,75),.7)

def fur(points,base=(62,58,49)):
    poly(points,base,'cloth')
    for a,b in zip(points,points[1:]+points[:1]):
        dist=math.dist(a,b)
        for j in range(int(dist/5)):
            t=j/max(1,int(dist/5));x=a[0]+(b[0]-a[0])*t;y=a[1]+(b[1]-a[1])*t
            tone=R.randint(-20,35)
            line([(x,y-7),(x+R.uniform(-13,13),y+R.uniform(12,32))],tuple(max(0,min(255,v+tone)) for v in base),R.uniform(1,3))

def trim(pts,c=(149,119,65),w=3):
    line(pts,(29,24,18),w+3);line(pts,c,w)

def background(index,accent):
    global im,scene,silhouette,ACC,R,NR
    silhouette=None
    ACC=accent;R=random.Random(760+index);NR=np.random.default_rng(760+index)
    yy,xx=np.mgrid[0:H*S,0:W*S].astype(np.float32);xx/=S;yy/=S
    halo=np.exp(-(((xx-510)/350)**2+((yy-780)/660)**2))
    n=NR.normal(0,1.7,halo.shape)
    arr=np.zeros((*halo.shape,3),dtype='uint8')
    for k in range(3):arr[:,:,k]=np.clip(6+halo*(accent[k]*.17+5)+n,0,255)
    im=Image.fromarray(arr)
    # Ruined cathedral architecture, submerged in shadow.
    for x in (115,208,790,888):
        poly([(x-20,180),(x+16,180),(x+20,1300),(x-29,1300)],(20,26,25))
        line([(x-20,1220),(x-17,330),(512,88),(x+16,330),(x+18,1200)],(30,35,30),3)
    line([(236,1170),(236,375),(285,271),(512,135),(739,271),(788,375),(788,1170)],(43,43,34),2)
    # Fog wisps, depth and broken stone ground.
    layer=Image.new('RGBA',im.size);d=ImageDraw.Draw(layer)
    for _ in range(48):
        x=R.uniform(30,1000);y=R.uniform(520,1400);rx=R.uniform(40,220);ry=R.uniform(5,23)
        d.ellipse(((x-rx)*S,(y-ry)*S,(x+rx)*S,(y+ry)*S),fill=(*accent, R.randint(4,11)))
    im=Image.alpha_composite(im.convert('RGBA'),layer.filter(ImageFilter.GaussianBlur(24*S))).convert('RGB')
    ellipse((244,1250,804,1392),(8,12,13))
    for _ in range(45):
        x=R.uniform(70,970);y=R.uniform(1280,1440);s=R.uniform(5,40)
        poly([(x,y),(x+s,y-6),(x+s*1.4,y+9),(x-s*.4,y+12)],(34,34,29),'metal')
    for _ in range(100):
        x=R.uniform(120,920);y=R.uniform(220,1380);r=R.choice([.6,.8,1,1.6])
        ellipse((x,y,x+r,y+r),tuple(int(v*R.uniform(.3,.65)) for v in accent))
    scene=im.copy()
    silhouette=Image.new('L',im.size)

def finish(index,name,subtitle):
    global im
    # Cold, directional back-light catches the outside silhouette.
    mask=silhouette
    shifted=ImageChops.offset(mask,4*S,1*S)
    rim=ImageChops.subtract(mask,shifted)
    rim=ImageChops.multiply(rim,Image.new('L',im.size,142))
    rimcolor=tuple(min(235,int(c*.55+95)) for c in ACC)
    colored=Image.new('RGB',im.size,rimcolor)
    im=Image.composite(colored,im,rim)
    # Soft atmosphere crossing the ankles.
    lay=Image.new('RGBA',im.size);d=ImageDraw.Draw(lay)
    for _ in range(14):
        x=R.randint(100,900);y=R.randint(1270,1360)
        d.ellipse(((x-160)*S,y*S,(x+160)*S,(y+18)*S),fill=(*ACC,11))
    im=Image.alpha_composite(im.convert('RGBA'),lay.filter(ImageFilter.GaussianBlur(19*S))).convert('RGB')
    # Discreet corner caption, editorial concept-sheet styling.
    fontpath='C:/Windows/Fonts/georgia.ttf'
    f=ImageFont.truetype(fontpath,25*S);small=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',10*S)
    d=ImageDraw.Draw(im)
    d.line((58*S,1434*S,140*S,1434*S),fill=(146,130,94),width=S)
    d.text((58*S,1450*S),name.upper(),font=f,fill=(195,186,163))
    d.text((60*S,1490*S),f'{index:02d}  /  {subtitle.upper()}',font=small,fill=(110,115,105))
    im.resize((W,H),Image.Resampling.LANCZOS).save(OUT/f'{index:02d}-{name.lower()}.png')
    print(f'Saved {index:02d}-{name.lower()}.png',flush=True)

def necromancer():
    background(1,(86,178,118))
    # Wind-torn outer mantle.
    poly([(413,427),(363,468),(316,657),(284,1160),(219,1304),(323,1254),(355,1331),(410,1259),(465,1320),(552,1284),(638,1312),(694,1252),(750,1301),(691,1136),(664,674),(616,470),(564,433)],(35,43,42),'cloth')
    for a,b,c in [(353,486,315),(391,540,371),(603,484,676),(638,626,704)]:
        poly([(a,b),(a+20,b+34),(c+25,1244),(c,1290)],(48,56,49),'cloth')
    # Boots visible below robe.
    poly([(413,1185),(482,1187),(475,1304),(450,1342),(367,1342),(375,1321),(412,1294)],(49,49,42),'leather')
    poly([(547,1191),(599,1172),(611,1292),(652,1323),(648,1340),(562,1340),(549,1311)],(52,52,44),'leather')
    poly([(437,716),(581,721),(637,1257),(578,1290),(511,1234),(458,1295),(385,1270)],(43,51,45),'cloth')
    for x in [421,457,503,552,595]:line([(508+(x-508)*.4,775),(x,1243)],(75,77,57),2)
    poly([(427,475),(486,448),(552,456),(595,495),(575,716),(522,776),(443,715)],(56,63,55),'leather')
    # Skeletal cuirass ribs, deliberately separate irregular bone plates.
    for j in range(6):
        y=510+j*30
        poly([(507,y),(459-j*2,y-12),(435+j,y-2),(450+j*2,y+13),(506,y+18)],(142-j*5,142-j*6,111-j*4),'bone')
        poly([(519,y),(563+j*2,y-10),(587-j,y),(572-j*2,y+14),(520,y+18)],(126-j*5,134-j*6,105-j*4),'bone')
    for j in range(9):poly([(507,503+j*26),(521,500+j*26),(526,516+j*26),(510,524+j*26)],(167,162,125),'bone')
    # Pauldrons with trophies.
    skull(405,488,1.23);skull(616,491,1.15)
    for x,di in [(381,-1),(637,1)]:
        for j in range(3):poly([(x+j*di*16,482),(x+di*(38+j*14),399+j*18),(x+di*(18+j*16),508)],(137,144,114),'bone')
    poly([(370,520),(410,539),(386,697),(348,755),(313,723)],(44,51,44),'cloth')
    poly([(614,532),(651,530),(679,676),(632,719),(600,681)],(39,48,43),'cloth')
    # Hood and gaunt hollow face.
    poly([(423,419),(439,340),(483,283),(531,291),(576,358),(585,441),(551,471),(454,459)],(31,39,36),'cloth')
    poly([(454,388),(474,331),(525,324),(554,386),(540,452),(472,451)],(7,16,15))
    face(505,390,.94)
    line([(480,389),(491,390)],(141,240,159),2);line([(516,389),(526,388)],(141,240,159),2)
    line([(459,414),(475,345),(495,319)],(91,108,81),2)
    # Great skull shield, with iron cage and teeth.
    poly([(279,663),(341,631),(407,658),(439,754),(422,873),(348,982),(270,891),(248,755)],(62,68,52),'metal')
    trim([(279,663),(341,643),(397,668),(425,755),(408,867),(348,960),(283,883),(262,752),(279,663)],(123,129,88),4)
    skull(342,778,2.32)
    for x in [294,322,349,376,403]:poly([(x,895),(x+9,884),(x+4,937)],(136,139,99),'bone')
    glow([(302,762),(316,761)],(103,217,126),4,9);glow([(361,761),(378,758)],(103,217,126),4,9)
    blood(387,850,.8)
    # Bone spear and hand gripping shaft.
    line([(699,1283),(700,407)],(32,37,28),18)
    line([(695,1283),(696,413)],(156,155,119),8)
    for y in range(470,1200,48):line([(689,y),(706,y-4)],(77,85,62),3)
    poly([(698,257),(673,389),(690,445),(716,409)],(173,178,141),'bone')
    poly([(673,360),(656,387),(674,442),(694,455),(690,414)],(132,148,111),'bone')
    poly([(716,362),(735,398),(716,443),(704,446)],(126,140,108),'bone')
    poly([(646,667),(665,652),(708,664),(713,690),(697,705),(664,696)],(141,143,112),'bone')
    for y in (673,682,691):line([(678,y),(706,y+2)],(57,69,49),2)
    for y in range(518,1200,85):rune(699,y,8,(130,202,124))
    glow([(679,408),(649,361),(661,299),(637,259),(659,206)],(83,211,121),2,15)
    glow([(716,420),(745,354),(730,301),(752,246)],(99,230,138),2,15)
    for x,y in [(651,341),(737,286),(643,235)]:orb(x,y,8,(106,229,147))
    skull(505,761,.65)
    finish(1,'necromancer','bone / decay / green flame')

def barbarian():
    background(2,(176,111,77))
    # Feet and leather-clad legs, with a heavy planted stance.
    for pts in [[(420,862),(502,880),(484,1103),(445,1275),(356,1291),(376,1080)],[(525,879),(607,858),(650,1090),(679,1287),(585,1295),(546,1108)]]:
        poly(pts,(83,66,49),'leather')
    for pts in [[(377,1089),(468,1110),(454,1269),(429,1303),(346,1312)],[(565,1100),(647,1083),(683,1301),(596,1317)]]:
        poly(pts,(96,97,83),'metal')
        rivets(pts[:-1])
    poly([(352,1273),(447,1273),(447,1335),(418,1360),(302,1358),(305,1331)],(54,47,37),'leather')
    poly([(591,1279),(671,1271),(717,1333),(715,1355),(603,1359),(584,1331)],(58,48,36),'leather')
    # Massive bare anatomy.
    poly([(390,440),(450,414),(558,411),(630,453),(663,547),(608,695),(591,817),(424,817),(411,685),(356,540)],(163,128,97),'skin')
    poly([(404,452),(488,462),(501,534),(479,586),(410,570),(385,527)],(179,138,103),'skin')
    poly([(514,467),(589,446),(630,505),(603,570),(540,585),(513,541)],(153,115,88),'skin')
    line([(503,468),(507,577),(502,735)],(64,48,38),3)
    for j in range(4):
        y=594+j*44
        poly([(465,y),(495,y-5),(497,y+29),(472,y+35),(449,y+19)],(149-j*5,111-j*3,84),'skin')
        poly([(514,y-5),(543,y),(561,y+20),(538,y+36),(514,y+28)],(134-j*3,99-j*3,74),'skin')
    # Arms and fists.
    for pts in [[(365,466),(412,504),(397,601),(355,673),(315,640),(308,550)],[(628,467),(674,512),(715,627),(673,665),(629,596),(609,532)]]:
        poly(pts,(168,127,92),'skin')
    poly([(317,623),(361,645),(339,748),(288,789),(262,752)],(149,107,79),'skin')
    poly([(673,641),(714,620),(754,748),(723,780),(681,730)],(143,105,76),'skin')
    fur([(334,444),(382,422),(438,442),(412,496),(354,536),(316,506)],(72,68,57))
    fur([(587,437),(633,418),(690,451),(712,507),(651,518),(616,480)],(77,70,56))
    for pts in [[(282,695),(334,707),(319,763),(267,758)],[(694,699),(742,682),(761,740),(713,764)]]:
        poly(pts,(72,76,65),'metal');rivets(pts)
    # Tribal paint, scars, chest strap.
    poly([(402,479),(421,467),(446,543),(429,576),(417,539)],(53,74,79))
    poly([(438,455),(449,451),(469,517),(457,539)],(44,62,69))
    line([(556,493),(584,537),(571,558)],(65,31,27),3)
    line([(560,491),(588,535)],(206,157,116),1)
    poly([(584,431),(604,443),(453,795),(429,789)],(57,46,33),'leather')
    for y in range(500,760,30):rivets([(586-(y-450)*.43,y)],(169,135,82))
    # Pelt kilt and trophy belt.
    fur([(421,785),(589,782),(634,932),(595,1013),(548,963),(500,1028),(448,970),(379,991)],(82,72,53))
    for x in [412,452,548,588]:poly([(x,819),(x+32,815),(x+35,970),(x+13,999),(x-7,964)],(96,73,48),'leather')
    poly([(412,775),(590,772),(601,821),(412,835)],(62,49,34),'leather')
    trim([(414,781),(588,780)],(156,127,76),4);skull(510,814,.71)
    face(508,367,1.32,beard=True)
    # Shaved head, plaited side hair and red tribal marks.
    poly([(467,331),(467,300),(489,281),(524,285),(545,311),(548,337),(526,320),(498,315)],(112,92,70),'skin')
    poly([(478,325),(488,323),(500,385),(488,393)],(90,28,25))
    poly([(514,320),(525,323),(535,374),(524,383)],(80,27,24))
    for x in [463,550]:
        for j in range(10):ellipse((x-5+j*.2,348+j*11,x+6+j*.2,362+j*11),(76+j*2,65+j,47))
        line([(x-6,441),(x+8,441)],(171,142,84),4)
    # Two enormous opposite-facing axes, bloodied and rusted.
    for x,di in [(237,-1),(786,1)]:
        line([(x-di*39,1040),(x+di*12,510)],(35,26,20),21)
        line([(x-di*43,1040),(x+di*7,510)],(113,82,48),8)
        for y in range(715,870,12):line([(x-9,y),(x+11,y+2)],(49,39,26),4)
        pts=[(x-9,536),(x+di*78,490),(x+di*127,460),(x+di*132,518),(x+di*117,604),(x+di*57,645),(x+di*20,597),(x-9,590)]
        poly(pts,(127,139,127),'metal')
        line(pts[2:6],(192,195,164),4)
        poly([(x-di*15,535),(x-di*67,556),(x-di*17,579)],(113,124,109),'metal')
        rune(x+di*53,558,19,(195,112,65));blood(x+di*103,562,1.2)
        poly([(x-24,757),(x-13,738),(x+20,740),(x+30,769),(x+15,797),(x-12,787)],(160,119,85),'skin')
        for y in range(753,780,8):line([(x-12,y),(x+19,y+4)],(76,54,39),2)
    blood(416,565,.8)
    finish(2,'barbarian','iron / warpaint / ancestral fury')

def sorceress():
    background(3,(105,137,187))
    # Split long mantle and layered skirt.
    poly([(437,475),(393,528),(336,763),(363,1122),(306,1311),(410,1289),(475,1175),(555,1202),(648,1328),(708,1274),(653,1121),(656,732),(588,472)],(37,43,69),'cloth')
    poly([(441,791),(510,837),(490,1049),(431,1314),(367,1328),(407,1105)],(51,63,84),'cloth')
    poly([(514,835),(575,791),(617,1103),(665,1316),(591,1294),(536,1045)],(38,47,68),'cloth')
    trim([(441,802),(414,1094),(376,1307)],(162,129,71),4)
    trim([(576,813),(610,1113),(648,1301)],(140,112,64),4)
    # Boots and legs, offset pose.
    poly([(457,887),(509,893),(489,1110),(464,1299),(407,1302),(418,1121)],(91,80,73),'leather')
    poly([(529,881),(579,875),(577,1108),(614,1284),(559,1301),(517,1116)],(87,74,67),'leather')
    for pts in [[(423,1113),(491,1108),(469,1288),(466,1341),(382,1340),(392,1315),(417,1280)],[(524,1110),(578,1100),(616,1280),(647,1324),(640,1343),(561,1334)]]:
        poly(pts,(64,74,87),'metal');trim(pts[:3],(165,137,79),3)
    for x in [450,551]:
        for y in range(1150,1260,33):rune(x,y,8,(170,150,94))
    # Fitted blue light armor and gold filigree.
    poly([(458,466),(484,447),(532,448),(566,470),(582,548),(555,641),(566,726),(586,796),(516,868),(430,797),(451,711),(455,628),(432,544)],(74,88,111),'metal')
    poly([(455,538),(495,511),(512,550),(500,605),(452,589)],(104,114,127),'metal')
    poly([(514,547),(536,511),(568,542),(563,590),(519,606)],(75,88,109),'metal')
    trim([(458,476),(480,499),(507,514),(536,499),(561,475)],(201,165,88),4)
    trim([(451,613),(507,638),(559,612)],(192,152,73),5)
    trim([(453,707),(509,735),(564,708)],(188,148,72),5)
    trim([(434,790),(510,846),(582,789)],(176,139,69),4)
    for side in [-1,1]:
        for j in range(5):
            x=510+side*(15+j*7);y=645+j*12
            line([(x,y+16),(x+side*12,y),(x+side*23,y+10),(x+side*12,y+23)],(176,143,77),1.4)
    poly([(505,625),(522,647),(509,674),(496,650)],(143,166,174),'metal')
    orb(509,649,9,(79,167,219))
    # Graceful bent arms, open palms for elemental magic.
    poly([(439,486),(466,530),(432,665),(400,703),(352,650),(363,619),(397,644)],(151,124,111),'skin')
    poly([(569,491),(600,499),(632,625),(664,596),(690,629),(641,692),(606,676)],(136,110,99),'skin')
    for pts in [[(356,617),(383,612),(411,665),(393,687),(367,664)],[(643,615),(668,592),(694,620),(669,657)]]:
        poly(pts,(77,88,104),'metal');trim(pts[:3],(186,148,75),3)
    poly([(362,630),(337,615),(318,585),(323,563),(332,589),(341,589),(341,555),(349,552),(354,591),(364,574),(371,581),(371,610)],(160,135,118),'skin')
    poly([(670,614),(684,582),(692,559),(698,562),(696,592),(709,578),(715,580),(708,608),(690,629)],(154,127,112),'skin')
    for x,di in [(439,-1),(581,1)]:
        poly([(x-di*18,483),(x+di*8,460),(x+di*42,485),(x+di*52,521),(x+di*17,539)],(91,103,118),'metal')
        trim([(x-di*18,483),(x+di*8,466),(x+di*42,489)],(197,163,90),3)
    # Hair behind the face, intricate crown.
    poly([(463,332),(494,303),(536,315),(562,358),(559,427),(589,502),(555,493),(534,441),(465,449),(431,500),(445,414)],(42,29,27),'cloth')
    face(508,387,1.02,True)
    for j in range(17):
        x=452+j*2;line([(482+j,324),(x,362),(x-5,436),(x-15,477)],(87,58,39),.8)
    poly([(472,355),(489,343),(506,315),(522,341),(545,351),(530,368),(507,349),(483,370)],(160,133,76),'metal')
    orb(507,347,7,(103,194,230))
    # Fire, frost and lightning: three separately legible energy signatures.
    orb(330,518,45,(242,112,35))
    for j in range(9):
        a=j*math.tau/9;x=330+math.cos(a)*27;y=518+math.sin(a)*30
        glow([(x,y),(x+R.uniform(-22,22),y-35),(x+R.uniform(-30,25),y-78)],(225,93+R.randint(0,60),31),2,11)
    orb(700,516,38,(65,174,235))
    for j in range(6):
        a=j*math.pi/3;dx=math.cos(a);dy=math.sin(a)
        glow([(700,516),(700+dx*43,516+dy*43)],(133,222,249),2,8)
        line([(700+dx*29-dy*11,516+dy*29+dx*11),(700+dx*21,516+dy*21),(700+dx*29+dy*11,516+dy*29-dx*11)],(151,222,241),1.5)
    orb(511,234,26,(155,137,235))
    for di in [-1,1]:
        glow([(511,234),(511+di*35,264),(511+di*20,282),(511+di*77,306),(511+di*90,342),(511+di*120,356)],(153,166,245),2,13)
    for y in [910,978,1046,1114]:rune(607+(y-910)*.1,y,10,(120,158,184))
    blood(457,1210,.5)
    finish(3,'sorceress','fire / frost / storm')

def paladin():
    background(4,(192,167,92))
    # Broken sacred halo behind the armored head.
    pts=[(512+151*math.cos(t),382+151*math.sin(t)) for t in np.linspace(0,math.tau,110)]
    glow(pts,(167,133,54),2,17)
    for j in range(32):
        a=j*math.tau/32;r=166
        line([(512+r*math.cos(a),382+r*math.sin(a)),(512+(r+R.randint(9,23))*math.cos(a),382+(r+R.randint(9,23))*math.sin(a))],(119,105,59),1)
    poly([(383,478),(438,431),(585,433),(644,479),(700,1243),(654,1320),(567,1271),(496,1315),(382,1295),(304,1324)],(69,38,32),'cloth')
    trim([(383,478),(354,1030),(321,1297)],(138,107,60),4)
    # Greaves, articulated knees and broad sabatons.
    for x in [439,565]:
        poly([(x-42,827),(x+45,827),(x+47,1057),(x+34,1146),(x-35,1144),(x-49,1027)],(113,120,111),'metal')
        poly([(x-42,1062),(x,1040),(x+48,1075),(x+35,1136),(x-28,1142),(x-50,1100)],(143,145,124),'metal')
        poly([(x-34,1130),(x+35,1129),(x+42,1297),(x+23,1326),(x-40,1320)],(130,135,120),'metal')
        trim([(x-28,1147),(x,1160),(x+30,1147)],(190,155,85),4)
        line([(x,1160),(x+4,1298)],(191,194,164),3)
        poly([(x-38,1289),(x+35,1292),(x+57,1339),(x+39,1360),(x-71,1355),(x-70,1335)],(102,112,105),'metal')
        for y in [1310,1323,1337]:line([(x-40,y),(x+39,y+3)],(49,60,55),3)
    # Breastplate, fluted steel and aged brass.
    poly([(422,467),(485,437),(550,444),(611,481),(617,585),(583,736),(511,786),(424,730),(393,579)],(145,147,125),'metal')
    poly([(430,494),(502,516),(501,682),(443,718),(415,576)],(119,129,120),'metal')
    poly([(513,517),(584,491),(599,578),(569,717),(518,681)],(91,105,102),'metal')
    trim([(423,476),(505,510),(596,480)],(198,160,79),6)
    trim([(432,728),(511,760),(580,731)],(184,141,66),5)
    # Engraved central sun-cross.
    ellipse((474,558,547,631),None,(177,145,74),3)
    line([(511,542),(511,656)],(202,175,103),9)
    line([(478,579),(544,579)],(202,175,103),8)
    orb(511,580,11,(215,187,91))
    for x in range(451,580,16):rune(x,706,7,(160,151,109))
    # Waist, tassets and hanging crimson tabard.
    poly([(423,748),(586,748),(600,801),(420,805)],(66,54,37),'leather')
    poly([(469,779),(551,782),(573,1067),(512,1116),(454,1072)],(88,45,34),'cloth')
    trim([(475,801),(468,1063),(512,1100),(561,1058),(545,799)],(157,118,62),3)
    for x in [410,558]:
        for j in range(4):
            y=792+j*32
            poly([(x,y),(x+56,y+4),(x+65,y+46),(x+4,y+39)],(126-j*5,130-j*5,112-j*3),'metal')
            rivets([(x+10,y+12),(x+49,y+16)])
    # Tower pauldrons.
    for x,di in [(407,-1),(605,1)]:
        poly([(x-di*21,478),(x+di*38,451),(x+di*89,488),(x+di*86,554),(x+di*28,582),(x-di*17,539)],(139,145,126),'metal')
        trim([(x-di*21,478),(x+di*38,458),(x+di*80,490),(x+di*79,543)],(182,148,75),5)
        for j in range(3):line([(x+di*20,501+j*15),(x+di*65,517+j*13)],(67,77,67),3)
    poly([(335,554),(390,571),(394,724),(347,786),(307,737)],(100,115,109),'metal')
    poly([(643,561),(691,551),(721,694),(678,752),(643,711)],(115,126,115),'metal')
    # Closed gothic helmet.
    poly([(461,345),(481,310),(527,305),(559,342),(569,406),(544,452),(507,472),(468,448),(451,402)],(139,145,125),'metal')
    poly([(478,358),(507,340),(544,354),(552,396),(514,434),(468,402)],(97,112,108),'metal')
    line([(469,379),(502,386),(547,375)],(12,20,21),9)
    line([(471,378),(502,382),(547,373)],(183,170,111),1.5)
    poly([(503,340),(516,343),(522,429),(508,455),(497,425)],(181,176,134),'metal')
    for x in [477,485,533,542]:line([(x,405),(x+2,424)],(32,45,44),3)
    trim([(460,348),(482,314),(511,308),(549,339)],(193,156,76),4)
    # Great kite shield, clear sacred icon.
    poly([(267,671),(352,645),(435,679),(446,854),(418,991),(351,1094),(269,986),(238,836)],(110,120,102),'metal')
    poly([(276,691),(350,666),(415,693),(425,846),(401,975),(350,1063),(287,974),(258,836)],(47,61,58),'metal')
    trim([(267,671),(352,651),(431,681),(440,854),(413,989),(351,1086),(275,985),(244,836),(267,671)],(185,148,73),6)
    ellipse((294,745,405,858),None,(167,140,76),5)
    poly([(336,718),(363,718),(363,775),(400,775),(400,800),(363,800),(363,956),(350,980),(336,956),(336,800),(298,800),(298,775),(336,775)],(200,175,106),'metal')
    glow([(350,742),(350,941)],(212,187,109),2,13)
    for y in [879,917,954]:rune(307,y,9,(150,137,90));rune(391,y,9,(150,137,90))
    blood(405,948,.9)
    # Long holy sword upright in right hand.
    poly([(742,315),(763,371),(750,680),(725,678),(727,371)],(168,181,168),'metal')
    line([(742,337),(739,670)],(230,230,192),3)
    glow([(741,385),(738,647)],(199,182,111),1.5,10)
    for y in range(428,633,42):rune(739,y,8,(205,190,125))
    poly([(680,671),(709,654),(732,670),(768,660),(791,680),(762,689),(735,682),(704,693)],(175,139,67),'metal')
    line([(736,686),(733,783)],(62,44,28),17)
    for y in range(695,779,10):line([(727,y),(742,y-3)],(144,113,56),2)
    poly([(683,706),(703,690),(740,707),(747,732),(732,755),(697,744)],(139,147,128),'metal')
    rivets([(702,711),(716,717),(732,722)])
    orb(733,788,9,(183,151,76))
    finish(4,'paladin','faith / steel / golden judgment')

def amazon():
    background(5,(134,159,116))
    # Short cloak and quiver visible beyond torso.
    poly([(439,465),(574,458),(636,623),(660,984),(608,1028),(536,858),(405,981),(359,1002),(394,673)],(48,62,48),'cloth')
    poly([(564,436),(598,420),(665,712),(617,733)],(89,64,39),'leather')
    for j in range(7):
        x=566+j*8;y=352+j%3*13
        line([(x,y),(x+57,611)],(128,115,78),2)
        poly([(x,y),(x-12,y-27),(x-11,y-49),(x+4,y-24),(x+10,y-48),(x+15,y-27),(x+5,y+7)],(127,136,107),'bone')
    # Dynamic planted legs.
    poly([(445,833),(509,845),(488,1064),(455,1285),(395,1299),(412,1061)],(132,110,83),'skin')
    poly([(524,844),(579,822),(590,1043),(664,1256),(609,1287),(526,1070)],(128,104,77),'skin')
    for pts in [[(415,1051),(490,1053),(476,1124),(404,1129)],[(528,1046),(589,1030),(611,1099),(549,1122)]]:
        poly(pts,(84,91,70),'metal');trim(pts[:3],(142,135,89),3)
    for pts in [[(406,1120),(475,1121),(451,1284),(456,1327),(433,1346),(360,1340),(364,1318),(391,1280)],[(550,1124),(611,1102),(663,1262),(697,1302),(683,1323),(615,1310),(593,1270)]]:
        poly(pts,(76,60,40),'leather');trim(pts[:3],(145,126,76),3)
    for j in range(7):
        y=1140+j*22
        line([(414-j*2,y),(451-j*2,y+15),(414-j*2,y+26)],(137,119,78),2)
        line([(572+j*6,y-10),(601+j*6,y-9),(577+j*6,y+12)],(122,108,68),2)
    # Light leather cuirass in leaflike layered pieces.
    poly([(449,477),(479,447),(533,446),(568,472),(591,541),(564,655),(558,745),(593,828),(517,893),(430,828),(449,738),(448,641),(421,544)],(112,84,50),'leather')
    for side in [-1,1]:
        poly([(510,537),(510+side*48,501),(510+side*75,554),(510+side*52,610),(511,595)],(127 if side<0 else 98,95 if side<0 else 76,47),'leather')
        trim([(510,539),(510+side*48,510),(510+side*69,552)],(165,140,82),3)
    for j in range(4):
        y=618+j*32
        poly([(454,y),(508,y+18),(565,y),(559,y+30),(511,y+48),(452,y+27)],(110-j*5,90-j*4,54),'leather')
        trim([(456,y+2),(508,y+22),(563,y+2)],(140,119,73),2)
    # Short layered leather skirt.
    for j in range(7):
        x=431+j*21;y=786+abs(j-3)*4
        poly([(x,y),(x+27,y-3),(x+39,920-abs(j-3)*9),(x+16,950-abs(j-3)*10),(x-7,913)],(105-j*3,81-j*2,43),'leather')
        rivets([(x+8,y+14)])
    poly([(436,763),(571,757),(582,795),(433,805)],(53,47,29),'leather')
    poly([(492,763),(529,762),(535,795),(494,803)],(162,139,76),'metal')
    rune(511,782,10,(192,167,97))
    # Arms: bow held away from body, arrow in relaxed opposite hand.
    poly([(427,493),(458,519),(421,655),(372,727),(340,703),(379,627)],(153,122,87),'skin')
    poly([(574,490),(605,516),(630,635),(689,669),(682,704),(608,677),(578,617)],(147,115,81),'skin')
    for pts in [[(361,657),(397,680),(368,732),(329,708)],[(643,650),(697,673),(688,710),(631,683)]]:
        poly(pts,(75,71,44),'leather');trim(pts[:3],(161,138,72),3);rivets(pts)
    poly([(331,704),(358,721),(350,753),(333,772),(317,756),(314,731)],(151,118,83),'skin')
    poly([(681,671),(705,672),(721,691),(712,717),(686,713),(675,694)],(154,121,83),'skin')
    # One asymmetrical shoulder plate.
    poly([(419,488),(433,465),(463,480),(472,523),(430,546),(403,520)],(105,114,84),'metal')
    trim([(419,488),(433,470),(458,484),(466,520)],(174,149,80),3)
    poly([(567,480),(584,468),(608,489),(615,527),(587,541)],(86,95,68),'metal')
    # Face and long golden braided hair.
    poly([(464,334),(485,312),(524,314),(550,340),(553,406),(533,450),(474,440),(451,394)],(101,82,43),'cloth')
    face(506,384,1.03,True)
    poly([(462,361),(466,333),(488,316),(524,321),(548,347),(533,358),(507,340),(485,353)],(157,129,66),'leather')
    for j in range(15):
        y=399+j*14;x=546+math.sin(j*.5)*9+j*1.2
        poly([(x-8,y-4),(x+8,y+1),(x+11,y+12),(x-2,y+20),(x-12,y+9)],(154-j*2,124-j,62),'leather')
        line([(x-8,y),(x+6,y+10),(x-4,y+17)],(192-j*2,157-j,84),1.5)
    line([(556,605),(572,607)],(164,143,80),5)
    trim([(464,363),(486,352),(508,359),(541,353)],(164,150,91),2)
    line([(482,391),(487,411),(493,420)],(52,70,55),4)
    # Tall recurved greatbow, silhouette clear of the body.
    bow=[(735,348),(776,374),(805,438),(820,520),(802,608),(718,694),(765,795),(780,894),(755,1002),(704,1095),(724,1041),(731,975),(745,887),(727,801),(693,712),(695,678),(766,590),(785,511),(780,440),(750,399),(735,348)]
    poly(bow,(133,99,50),'leather')
    trim(bow[:10],(187,151,76),4)
    line([(738,355),(707,695),(707,1088)],(182,181,139),1)
    line([(702,664),(716,731)],(45,46,30),20)
    for y in range(666,732,7):line([(695+(y-666)*.2,y),(712+(y-666)*.2,y-2)],(145,127,72),2)
    for x,y in [(788,455),(799,529),(773,601),(756,850),(756,931)]:rune(x,y,10,(131,197,138))
    glow([(782,449),(796,508),(786,558)],(120,182,125),1.5,8)
    # Arrow shaft held in free hand, iron broadhead pointing down.
    line([(344,641),(273,1191)],(138,116,69),3)
    poly([(273,1183),(255,1220),(267,1214),(275,1236),(287,1204)],(132,149,122),'metal')
    for j in range(9):line([(341-j*.9,655+j*7),(325-j*.9,641+j*7)],(120,132,102),3)
    blood(441,1121,.55)
    finish(5,'amazon','leather / longbow / wilderness')

if __name__=='__main__':
    OUT.mkdir(parents=True,exist_ok=True)
    for render in (necromancer,barbarian,sorceress,paladin,amazon):render()
