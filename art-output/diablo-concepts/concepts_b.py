"""Group B: five original procedural dark-gothic character illustrations.
Run with Python + Pillow + numpy. Only writes 06--10 PNGs beside this script.
"""
from pathlib import Path
import math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT = Path(__file__).resolve().parent
W,H=1024,1536
r=random.Random(610)
Y,X=np.mgrid[:H,:W]

class Art:
    def __init__(self,number,name,subtitle,accent):
        self.number,self.name,self.subtitle,self.accent=number,name,subtitle,accent
        self.r=random.Random(number*1337)
        rng=np.random.default_rng(number)
        self.noise=rng.normal(0,2,(H,W))
        halo=np.exp(-(((X-512)/360)**2+((Y-690)/560)**2))
        arr=np.zeros((H,W,3))
        for k in range(3): arr[:,:,k]=7+halo*(accent[k]*.20)+self.noise
        self.im=Image.fromarray(np.uint8(np.clip(arr,0,255)))
        self.glow=Image.new('RGB',(W,H))
        # Ancient architecture, scarcely visible beyond the haze.
        d=ImageDraw.Draw(self.im)
        for x in (94,214,810,930):
            d.polygon([(x-25,1340),(x-18,330),(x,200),(x+18,330),(x+28,1340)],fill=(13,18,19))
            d.line([(x-16,1290),(x-10,340),(x,260)],fill=(27,32,31),width=2)
        for rad in (280,302,390):
            d.arc((512-rad,150,512+rad,150+rad*2),185,355,fill=(28,34,32),width=2)
        for _ in range(170):
            x=self.r.randrange(W); y=self.r.randrange(1180,H)
            d.line((x,y,x+self.r.randrange(8,100),y-5),fill=(22,25,24),width=1)
        self.fog(0.22)
        d=ImageDraw.Draw(self.im)
        d.ellipse((225,1250,810,1370),fill=(4,7,8))

    def fog(self,strength=.2):
        a=Image.new('RGBA',(W,H)); d=ImageDraw.Draw(a)
        for _ in range(65):
            x=self.r.randrange(-200,1000); y=self.r.randrange(650,1420)
            d.ellipse((x,y,x+self.r.randrange(100,600),y+self.r.randrange(10,75)),fill=(*self.accent,int(20*strength)))
        self.im=Image.alpha_composite(self.im.convert('RGBA'),a.filter(ImageFilter.GaussianBlur(28))).convert('RGB')

    def poly(self,p,c,edge=None,grain=6):
        mask=Image.new('L',(W,H)); ImageDraw.Draw(mask).polygon(p,fill=255)
        x0,y0,x1,y1=mask.getbbox() or (0,0,1,1)
        # Uneven lighting and mineral-like grain inside every material surface.
        xx=X[y0:y1,x0:x1]; yy=Y[y0:y1,x0:x1]
        v=.53+.45*(1-(xx-x0)/max(1,x1-x0))+.17*np.sin(xx*.028+yy*.013)
        arr=np.stack([v*t+self.noise[y0:y1,x0:x1]*grain/2 for t in c],axis=-1)
        patch=Image.fromarray(np.uint8(np.clip(arr,0,255)))
        self.im.paste(patch,(x0,y0),mask.crop((x0,y0,x1,y1)))
        d=ImageDraw.Draw(self.im)
        d.line(p+[p[0]],fill=edge or tuple(int(t*.28) for t in c),width=2)
        # Broken edge rim catches.
        for i in range(len(p)-1):
            if i%3==0:
                a,b=p[i],p[i+1]
                q=(int(a[0]*.3+b[0]*.7),int(a[1]*.3+b[1]*.7))
                d.line([a,q],fill=tuple(int(t*.5+c[k]*.35) for k,t in enumerate(self.accent)),width=2)

    def line(self,p,c,w=2): ImageDraw.Draw(self.im).line(p,fill=c,width=w,joint='curve')
    def ellipse(self,box,c): ImageDraw.Draw(self.im).ellipse(box,fill=c)
    def light(self,p,c=None,w=3):
        c=c or self.accent
        ImageDraw.Draw(self.glow).line(p,fill=c,width=w*3,joint='curve')
        self.line(p,c,w)
    def rune(self,x,y,s=15):
        self.light([(x,y-s),(x-s*.55,y),(x,y+s),(x+s*.55,y),(x,y-s),(x,y+s)],w=2)
        self.light([(x-s*.8,y-s*.5),(x+s*.8,y+s*.5)],w=1)
    def scratches(self,box,n=120,color=(114,93,71)):
        for _ in range(n):
            x=self.r.randint(box[0],box[2]); y=self.r.randint(box[1],box[3])
            self.line([(x,y),(x+self.r.randint(-6,7),y+self.r.randint(2,14))],color,1)
    def chain(self,p,count=20):
        a,b=p
        for i in range(count):
            t=i/(count-1); x=a[0]*(1-t)+b[0]*t; y=a[1]*(1-t)+b[1]*t+math.sin(t*math.pi)*25
            ImageDraw.Draw(self.im).ellipse((x-5,y-8,x+5,y+8),outline=(114,104,77),width=2)
    def fur(self,cx,cy,rx,ry,n=420):
        for _ in range(n):
            theta=self.r.random()*math.tau; rad=math.sqrt(self.r.random())
            x=cx+math.cos(theta)*rx*rad; y=cy+math.sin(theta)*ry*rad
            length=self.r.uniform(10,55)
            col=self.r.choice([(51,46,36),(76,66,48),(103,89,62),(36,34,29),(128,113,81)])
            self.line([(x,y),(x+math.sin(theta)*length*.4,y+length)],col,self.r.randint(1,3))
    def finish(self,filename):
        from PIL import ImageChops
        self.im=ImageChops.screen(self.im,self.glow.filter(ImageFilter.GaussianBlur(20)))
        self.im=ImageChops.screen(self.im,self.glow.filter(ImageFilter.GaussianBlur(5)))
        self.fog(.3)
        d=ImageDraw.Draw(self.im)
        for _ in range(170):
            x=self.r.randrange(70,954); y=self.r.randrange(180,1390)
            if self.r.random()<.4: d.ellipse((x,y,x+2,y+3),fill=tuple(int(t*.7) for t in self.accent))
        serif='C:/Windows/Fonts/georgia.ttf'
        font=ImageFont.truetype(serif,23); small=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',12)
        d.line((52,1434,242,1434),fill=(133,119,89),width=1)
        d.text((52,1451),f'{self.number:02d} / {self.name.upper()}',font=font,fill=(195,184,154))
        d.text((54,1486),self.subtitle.upper(),font=small,fill=(116,119,108))
        self.im.save(OUT/filename)
        print(filename, self.im.size)

def boots(a,left=410,right=565):
    for x,dx in [(left,-25),(right,30)]:
        a.poly([(x-37,973),(x+43,974),(x+30,1150),(x+43+dx,1282),(x+dx+22,1310),(x-53,1303),(x-38,1240)],(45,43,38))
        for y in range(1060,1240,30): a.line([(x-34,y),(x+30,y-12)],(105,89,65),4)
        a.poly([(x-27,1000),(x+32,998),(x+20,1160),(x-20,1180)],(75,77,67))

def druid():
    a=Art(6,'Druid','The wild remembers',(143,190,125))
    # Gnarled staff, roots and orbiting nature sigils.
    a.line([(790,1310),(776,1000),(793,790),(765,545),(791,315),(749,238),(762,173)],(38,29,20),24)
    a.line([(784,1300),(769,993),(785,792),(757,540),(782,316),(743,239)],(125,107,66),5)
    for p in [[(787,371),(841,279),(831,219),(862,179)],[(777,316),(707,275),(695,219)],[(777,510),(831,449),(848,389)]]: a.line(p,(88,75,44),10)
    for x,y in [(764,270),(811,323),(767,423),(792,530)]: a.rune(x,y,14)
    boots(a)
    a.poly([(380,650),(618,647),(661,1029),(626,1084),(584,1058),(550,1120),(506,1069),(456,1115),(418,1067),(360,1084),(338,1000)],(57,59,39))
    for i in range(9):
        x=357+i*31
        a.poly([(x+10,711),(x+36,706),(x+25,1045+(i%3)*20),(x,1017)],(68+i%3*8,64,44))
    a.poly([(389,450),(465,411),(568,420),(622,470),(613,751),(554,821),(393,762)],(74,65,44))
    a.poly([(379,477),(337,502),(299,642),(338,796),(375,781),(361,651),(416,541)],(78,67,49))
    a.poly([(611,484),(663,515),(692,680),(773,652),(796,691),(684,749),(648,723),(591,557)],(91,77,52))
    a.poly([(756,651),(790,636),(812,656),(810,693),(781,704),(759,685)],(136,110,78))
    # One hand partially transformed into a beast claw.
    a.poly([(325,753),(369,746),(392,800),(375,850),(349,839),(327,802)],(109,105,71))
    for x in (340,355,370,383): a.poly([(x,801),(x+7,810),(x+5,853),(x-8,871)],(169,160,120))
    a.fur(405,487,95,95); a.fur(599,483,91,86)
    a.poly([(446,307),(489,279),(545,299),(574,346),(552,420),(516,449),(467,414),(449,368)],(145,119,84))
    a.poly([(442,336),(435,296),(472,256),(540,262),(570,301),(568,356),(547,324),(525,304),(477,315)],(72,57,37))
    a.poly([(452,375),(479,392),(500,384),(519,397),(555,365),(551,454),(514,510),(468,470)],(96,77,47))
    a.fur(506,429,42,48,160)
    a.line([(470,347),(490,343)],(25,24,18),5);a.line([(523,344),(543,349)],(25,24,18),5)
    a.light([(474,348),(488,348)],w=2);a.light([(525,349),(539,352)],w=2)
    a.line([(506,348),(498,379),(515,381)],(71,55,36),3)
    a.chain([(425,528),(582,532)],24)
    for y in (568,619,666): a.rune(513,y,13)
    a.poly([(386,737),(615,720),(618,758),(391,779)],(43,34,23))
    a.ellipse((485,730,532,775),(122,105,63));a.rune(509,752,15)
    # Wolf companion, full quadruped silhouette.
    a.poly([(119,1119),(175,1054),(262,1067),(320,1121),(334,1224),(309,1310),(280,1307),(291,1209),(247,1187),(224,1315),(197,1312),(199,1199),(159,1210),(139,1304),(114,1300),(129,1194),(85,1162),(60,1090)],(75,81,75))
    a.poly([(175,1062),(164,1008),(194,1036),(215,985),(231,1043),(258,1090),(231,1140),(196,1138),(153,1105)],(115,119,103))
    a.fur(216,1133,48,53,150)
    a.poly([(152,1091),(185,1085),(203,1110),(178,1122),(148,1110)],(53,57,54))
    a.light([(185,1069),(197,1074)],w=2)
    # Raven, jagged feathers on staff.
    a.poly([(785,228),(749,203),(702,160),(647,153),(695,181),(660,181),(705,200),(685,209),(735,221),(773,260),(804,250),(829,231),(810,227),(805,204),(791,207)],(24,31,28))
    a.light([(800,216),(803,217)],w=1)
    for x,y in [(299,890),(728,867),(703,1097)]: a.rune(x,y,20)
    a.finish('06-druid.png')

def assassin():
    a=Art(7,'Assassin','Silence is the final rite',(176,100,244))
    # Torn asymmetric cape.
    a.poly([(437,370),(570,365),(661,530),(716,871),(801,1186),(711,1131),(734,1247),(659,1201),(633,1287),(561,1132),(360,1182),(326,1251),(281,1198),(292,1050),(349,665)],(39,30,48))
    for x in (333,385,609,657): a.line([(493,428),(x,811),(x-30,1168)],(63,44,73),2)
    boots(a,433,573)
    a.poly([(397,714),(583,703),(618,862),(598,1032),(550,1042),(510,869),(461,1041),(395,1023),(385,869)],(52,45,56))
    for x in (419,564):
        for y in range(850,1030,34): a.line([(x-27,y),(x+29,y+13)],(110,82,111),6)
    a.poly([(408,449),(458,413),(541,416),(599,467),(575,587),(561,670),(589,726),(507,781),(397,723),(424,626),(398,559)],(58,55,66))
    a.poly([(428,468),(497,449),(511,556),(462,595),(415,551)],(105,104,118))
    a.poly([(508,449),(567,464),(585,543),(542,592),(511,556)],(76,72,92))
    for y in range(595,718,25):
        a.poly([(431,y),(507,y+15),(565,y-5),(562,y+15),(506,y+34),(425,y+20)],(89,75,92))
    a.poly([(393,465),(350,491),(319,640),(273,741),(308,772),(369,684),(429,521)],(64,58,70))
    a.poly([(592,467),(640,495),(683,633),(729,708),(699,746),(625,667),(558,525)],(70,60,75))
    for x,y in [(365,486),(596,486)]:
        a.poly([(x-34,y+8),(x+20,y-20),(x+61,y+37),(x+9,y+70),(x-28,y+54)],(106,100,115))
        for off in range(0,50,12): a.line([(x-20+off,y+16),(x+off,y+48)],(151,134,144),2)
    # Hood and masked face.
    a.poly([(423,409),(417,326),(453,264),(510,239),(565,278),(591,352),(570,425),(539,398),(461,412)],(51,43,60))
    a.poly([(449,331),(477,292),(532,301),(557,342),(544,390),(468,386)],(142,123,130))
    a.poly([(449,356),(488,370),(554,351),(549,407),(506,435),(463,406)],(37,32,43))
    a.line([(459,341),(484,343)],(23,19,30),6);a.line([(518,342),(541,335)],(23,19,30),6)
    a.light([(461,342),(480,344)],w=2);a.light([(520,341),(538,337)],w=2)
    for y in (377,390,403): a.line([(469,y),(538,y-10)],(83,67,89),2)
    # Triple steel claws, weathered gauntlets.
    for x,y,sgn in [(289,740,-1),(713,725,1)]:
        a.poly([(x-29,y-37),(x+25,y-31),(x+35,y+37),(x-20,y+48)],(111,108,119))
        for i in range(3):
            xx=x+(i-1)*18
            a.poly([(xx-5,y+21),(xx+8,y+26),(xx+sgn*42,y+141),(xx+sgn*51,y+178),(xx+sgn*20,y+138)],(159,161,174))
            a.line([(xx+3,y+35),(xx+sgn*44,y+158)],(225,212,228),2)
        a.scratches((x-18,y-15,x+20,y+25),25)
    a.chain([(429,737),(589,782)],25)
    a.rune(506,754,18)
    for x,y in [(232,1224),(781,1153),(697,1350)]:
        a.poly([(x-60,y),(x,y-26),(x+60,y),(x,y+24)],(63,48,72))
        a.light([(x-54,y),(x,y-20),(x+54,y),(x,y+19),(x-54,y)],w=2)
        a.rune(x,y-10,20)
        for angle in (0,2.1,4.2):
            dx,dy=math.cos(angle)*35,math.sin(angle)*12
            a.poly([(x+dx-8,y+dy),(x+dx,y+dy-42),(x+dx+8,y+dy)],(132,117,147))
    a.finish('07-assassin.png')

def andariel():
    a=Art(8,'Andariel','Maiden of anguish',(115,236,76))
    # Four towering segmented arachnid limbs emerging from the back.
    for p in [[(439,533),(289,446),(189,217),(109,319),(77,654)],[(586,539),(730,442),(827,190),(911,297),(950,627)],[(420,626),(223,596),(110,827),(153,1093)],[(608,624),(800,591),(929,824),(865,1110)]]:
        for i in range(len(p)-1):
            x,y=p[i];xx,yy=p[i+1];w=24-i*6
            a.poly([(x-w,y),(x+w,y+10),(xx+max(2,w-9),yy),(xx,yy+20),(xx-max(2,w-9),yy)],(80,98,51))
            a.line([(x-w+4,y),(xx-4,yy)],(160,177,91),3)
            a.ellipse((x-17,y-17,x+17,y+17),(38,51,30))
            if i<2: a.poly([(xx,yy),(xx+(-45 if xx<512 else 45),yy-50),(xx+10,yy+30)],(123,139,71))
        a.light([p[-2],p[-1]],w=2)
    # Long clawed digitigrade legs.
    for x,sgn in [(451,-1),(566,1)]:
        a.poly([(x-45,831),(x+40,828),(x+44,989),(x+sgn*24,1106),(x+sgn*53,1251),(x+sgn*44,1307),(x-24+sgn*45,1321),(x-40,1255),(x-31,1110),(x-48,981)],(139,136,91))
        a.poly([(x-35,968),(x+32,966),(x+19,1079),(x-10,1114)],(72,86,48))
        for i in range(3):
            xx=x+sgn*32+(i-1)*19
            a.poly([(xx,1275),(xx+12,1290),(xx+sgn*13,1346),(xx-8,1322)],(166,162,111))
    # Organic cuirass keeps the demon fully armored.
    a.poly([(425,441),(479,416),(545,419),(596,448),(607,563),(566,659),(582,770),(613,844),(567,910),(511,873),(455,913),(402,848),(437,741),(444,642),(405,548)],(128,135,84))
    for i in range(6):
        y=507+i*49; w=88-i*6
        a.poly([(512-w,y-22),(508,y+15),(512+w,y-22),(512+w-10,y+16),(510,y+49),(520-w,y+13)],(54+i*5,76+i*3,43))
        a.line([(512-w,y-21),(509,y+14),(512+w,y-22)],(151,161,98),3)
    a.poly([(410,467),(367,501),(337,675),(288,817),(319,852),(385,722),(448,523)],(135,140,91))
    a.poly([(598,473),(643,501),(677,668),(727,800),(699,838),(630,713),(565,518)],(143,145,94))
    for x,y,sgn in [(306,827,-1),(712,817,1)]:
        for i in range(4):
            a.poly([(x+(i-2)*13,y),(x+sgn*14+(i-2)*16,y+47),(x+sgn*20+(i-2)*18,y+88),(x+sgn*5+(i-2)*16,y+54)],(150,162,100))
            a.light([(x+(i-2)*14,y+48),(x+sgn*20+(i-2)*18,y+88)],w=1)
    # Flame-shaped hair, crown and cruel narrow visage.
    for i in range(18):
        x=411+i*12
        a.poly([(491,347),(x,252-abs(i-8)*7),(x-25,176+(i%4)*22),(x+26,284),(552,378)],(95+i%4*12,38,26))
    a.poly([(458,322),(482,294),(532,298),(554,329),(545,393),(510,426),(474,394)],(155,156,107))
    a.poly([(458,330),(479,348),(500,339),(514,361),(531,341),(551,327),(540,299),(482,293)],(59,76,38))
    a.light([(471,353),(490,358)],w=3);a.light([(526,358),(544,351)],w=3)
    a.line([(511,356),(503,381),(517,383)],(70,77,45),3)
    a.line([(490,397),(510,392),(530,396)],(38,37,23),4)
    for x in range(495,529,8): a.line([(x,395),(x+2,402)],(197,191,135),2)
    for x,sgn in [(469,-1),(544,1)]:
        a.poly([(x,328),(x+sgn*26,287),(x+sgn*39,239),(x+sgn*15,255),(x-sgn*6,300)],(101,115,65))
    for y in (620,687,754,811): a.rune(511,y,11)
    for x,y in [(244,1003),(770,1078),(349,1179)]:
        a.rune(x,y,19)
        for i in range(8): a.ellipse((x+i*3,y+i*9,x+i*3+3,y+i*9+5),(91,143,56))
    a.finish('08-andariel.png')

def bloodraven():
    a=Art(9,'Blood Raven','The dead answer her call',(189,70,73))
    # Restless dead, desaturated and partly lost in fog.
    for x,y,s in [(189,912,.8),(816,967,.85),(278,1100,.6),(721,1164,.55)]:
        a.poly([(x-45*s,y),(x+32*s,y-16),(x+68*s,y+94),(x+90*s,y+240),(x+18*s,y+182),(x-13*s,y+266),(x-61*s,y+216),(x-75*s,y+84)],(35,52,51))
        a.ellipse((x-26*s,y-68*s,x+26*s,y+10*s),(76,91,81))
        for dx in (-13,11): a.ellipse((x+dx*s-5,y-39*s,x+dx*s+5,y-29*s),(15,26,27))
        a.line([(x-13*s,y-9*s),(x+13*s,y-8*s)],(31,42,36),3)
        a.line([(x-31*s,y+50*s),(x-85*s,y+20*s),(x-103*s,y-63*s)],(65,78,69),10)
        for j in range(4):a.line([(x-104*s+j*5,y-60*s),(x-117*s+j*7,y-93*s)],(83,91,77),2)
    a.poly([(438,353),(558,364),(635,468),(631,807),(716,1201),(664,1168),(668,1282),(588,1223),(553,1306),(488,1215),(427,1279),(386,1200),(322,1260),(340,1123),(288,1170),(350,792),(353,490)],(65,27,32))
    for x in range(354,651,34): a.line([(492,452),(x,860),(x+17,1195)],(102,40,44),2)
    boots(a,444,562)
    a.poly([(415,722),(577,720),(602,882),(587,1035),(538,1051),(505,900),(477,1053),(414,1039),(398,872)],(53,49,47))
    a.poly([(409,452),(472,418),(548,426),(593,475),(563,619),(577,749),(510,790),(410,741),(434,611)],(86,78,70))
    for y in range(485,735,31):
        a.poly([(429,y),(501,y+20),(573,y+1),(568,y+26),(507,y+45),(422,y+24)],(94,86,77))
    a.poly([(422,463),(372,480),(331,580),(285,652),(303,685),(378,626),(452,508)],(113,119,107))
    a.poly([(577,466),(622,482),(664,542),(685,485),(716,492),(706,595),(672,625),(609,581),(553,511)],(116,121,109))
    for x,y in [(371,486),(585,483)]:
        a.poly([(x-32,y),(x+14,y-22),(x+53,y+22),(x+30,y+59),(x-31,y+43)],(92,86,75))
        for j in range(4): a.poly([(x+j*12-20,y),(x+j*12-12,y-35-j*3),(x+j*12-4,y+7)],(145,131,107))
    # Swept hood and pale fallen face.
    a.poly([(425,418),(420,323),(463,268),(524,258),(570,300),(583,406),(549,432),(459,415)],(75,31,36))
    a.poly([(455,333),(483,303),(530,308),(553,345),(538,402),(508,426),(470,400)],(162,170,151))
    a.poly([(447,332),(472,286),(540,291),(570,336),(547,355),(529,320),(483,326),(467,374),(451,429)],(34,28,28))
    a.line([(468,358),(489,362)],(48,40,38),7);a.line([(521,361),(541,354)],(48,40,38),7)
    a.light([(471,359),(487,361)],(251,48,44),3);a.light([(523,359),(538,356)],(251,48,44),3)
    a.line([(505,358),(498,385),(513,387)],(92,103,90),3)
    a.line([(492,405),(519,402)],(83,44,42),3)
    # Great recurved bow with crimson string and nocked arrow.
    bow=[(275,416),(236,475),(252,549),(291,640),(264,745),(221,847),(238,933)]
    a.line(bow,(38,27,22),20);a.line(bow,(139,108,66),8)
    a.line([(275,416),(308,654),(238,933)],(193,112,95),2)
    a.line([(227,665),(710,489)],(165,152,114),4)
    a.poly([(213,670),(240,648),(242,666)],(192,187,157))
    for i in range(5): a.line([(668+i*7,507-i*2),(677+i*7,484-i*2)],(121,38,40),5)
    a.poly([(282,640),(305,638),(321,657),(310,684),(289,682)],(159,162,142))
    a.poly([(682,474),(704,471),(721,484),(710,510),(687,506)],(159,162,142))
    a.chain([(426,741),(581,780)],23)
    for x,y in [(501,554),(497,660),(507,756)]: a.rune(x,y,12)
    # Blood and corrosion on the armor.
    a.scratches((452,500,553,730),130,(114,75,54))
    for _ in range(32):
        x=a.r.randrange(465,552);y=a.r.randrange(550,701)
        a.line([(x,y),(x-2,y+a.r.randrange(2,19))],(91,28,27),2)
    a.finish('09-blood-raven.png')

def diablo():
    a=Art(10,'Diablo','Lord of terror',(250,111,41))
    # Hellfire tongues behind the colossal silhouette.
    for i in range(36):
        x=125+i*22; y=a.r.randrange(840,1210)
        a.poly([(x-20,1333),(x-28,y+100),(x+15,y-80),(x+4,y+67),(x+38,y+139),(x+29,1332)],(114+a.r.randrange(50),42,14))
        a.light([(x,1305),(x+12,y+158),(x+9,y+67)],(165,57,15),3)
    # Barbed tail curls out to one side.
    a.poly([(603,1005),(703,1034),(795,1147),(837,1140),(877,1087),(872,992),(826,942),(801,870),(849,917),(902,959),(930,1046),(921,1130),(866,1208),(796,1219),(685,1157),(563,1104)],(132,49,34))
    for i in range(7):
        x=737+i*23;y=1140+int(math.sin(i*.5)*45)
        a.poly([(x-12,y),(x+5,y-58),(x+14,y+8)],(109,94,66))
    # Spines radiate well outside the trunk.
    for s in (-1,1):
        for i in range(7):
            x=512+s*(109+i*19);y=385+i*51
            a.poly([(x-s*29,y+41),(x+s*(68+i*4),y-100+i*8),(x+s*23,y+60)],(111,84,60))
            a.line([(x,y+21),(x+s*(68+i*4),y-100+i*8)],(187,142,86),2)
    # Muscular digitigrade legs and huge talons.
    for x,s in [(404,-1),(615,1)]:
        a.poly([(x-62,805),(x+70,812),(x+83,958),(x+23,1086),(x+s*41,1245),(x+35,1307),(x-62,1305),(x-44,1193),(x-72,1087),(x-83,947)],(151,58,42))
        a.poly([(x-49,868),(x+49,863),(x+50,968),(x+3,1047),(x-39,1005)],(184,72,47))
        a.poly([(x-38,1057),(x+14,1064),(x+28,1178),(x-17,1219),(x-43,1174)],(89,54,40))
        for j in range(3):
            xx=x-48+j*37
            a.poly([(xx,1254),(xx+27,1269),(xx+36,1320),(xx+7,1344),(xx-12,1325)],(91,58,39))
            a.poly([(xx+4,1300),(xx+23,1302),(xx+25,1358),(xx-5,1346)],(193,158,102))
    a.poly([(391,382),(472,350),(561,355),(646,399),(691,522),(647,686),(602,785),(617,865),(511,928),(394,857),(422,755),(367,628),(339,490)],(137,46,34))
    a.poly([(382,428),(476,411),(505,465),(490,551),(410,549),(365,502)],(190,67,44))
    a.poly([(526,448),(564,407),(639,432),(663,503),(608,550),(528,548)],(168,54,36))
    for i in range(5):
        y=560+i*54;ww=62-i*5
        a.poly([(506-ww,y),(496,y-10),(505,y+38),(481,y+49),(506-ww,y+31)],(170-i*8,61-i*3,39))
        a.poly([(519,y-9),(521+ww,y),(521+ww,y+31),(538,y+49),(513,y+38)],(153-i*6,52,35))
    a.poly([(484,843),(511,807),(551,845),(513,898)],(86,48,34))
    # Arms and huge splayed claws.
    for s in (-1,1):
        def pts(p): return [(512+s*(x-512),y) for x,y in p]
        a.poly(pts([(630,423),(703,411),(759,477),(762,598),(809,734),(776,796),(725,756),(677,634),(649,559)]),(153,53,37))
        a.poly(pts([(689,454),(728,460),(743,517),(720,584),(685,551)]),(186,67,42))
        a.poly(pts([(744,624),(773,659),(803,738),(773,768),(739,719)]),(100,46,33))
        a.poly(pts([(773,749),(812,751),(850,812),(832,860),(787,851),(762,800)]),(146,56,38))
        for j in range(4):
            x=779+j*19;y=819+(j%2)*9
            a.poly(pts([(x,y),(x+16,y),(x+26,y+55),(x+12,y+96),(x+3,y+56)]),(158,66,44))
            a.poly(pts([(x+12,y+61),(x+25,y+55),(x+14,y+113),(x-1,y+94)]),(192,153,102))
        for j in range(3):
            a.poly(pts([(714+j*15,659+j*24),(765+j*20,621+j*20),(736+j*15,693+j*24)]),(133,111,74))
    # Crown of sweeping horns.
    for s in (-1,1):
        def p(q):return [(512+s*(x-512),y) for x,y in q]
        a.poly(p([(551,325),(605,307),(652,245),(647,175),(617,119),(628,188),(610,235),(556,263)]),(135,108,73))
        a.poly(p([(541,279),(570,236),(573,178),(548,137),(555,198),(527,245)]),(111,88,62))
        for j in range(6): a.line(p([(580+j*9,275-j*12),(599+j*7,283-j*14)]),(58,45,33),3)
    a.poly([(451,266),(504,241),(556,267),(581,325),(555,388),(515,423),(468,394),(439,328)],(163,58,39))
    a.poly([(451,287),(487,302),(505,284),(522,302),(566,286),(551,327),(520,341),(500,340),(464,330)],(77,36,28))
    a.light([(460,315),(490,325)],(255,180,53),4);a.light([(529,324),(558,312)],(255,180,53),4)
    a.poly([(506,312),(489,356),(513,365),(528,353)],(120,43,30))
    a.poly([(462,356),(494,370),(524,369),(557,351),(545,389),(512,401),(477,388)],(27,16,13))
    for j in range(8):
        x=474+j*9;y=370+int(math.sin(j/7*math.pi)*6)
        a.poly([(x,y),(x+6,y),(x+3,y+13)],(222,184,121))
    for x in (476,542):a.poly([(x,381),(x+8,377),(x+6,363)],(239,191,121))
    a.poly([(492,400),(513,447),(530,398),(513,413)],(142,75,45))
    # Glowing fissures and scars following anatomical planes.
    for p in [[(404,457),(429,477),(417,500),(441,523)],[(598,448),(580,472),(595,490)],[(479,585),(466,613),(483,629)],[(551,691),(539,720),(550,743)],[(377,906),(405,933),(393,955)],[(645,930),(624,955),(636,989)]]: a.light(p,(231,95,30),2)
    a.finish('10-diablo.png')

if __name__=='__main__':
    OUT.mkdir(parents=True,exist_ok=True)
    druid();assassin();andariel();bloodraven();diablo()
