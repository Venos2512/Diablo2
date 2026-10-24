"""Prototype: ve ban do trong so len mesh trong Blender (Workbench VERTEX). blender -b --factory-startup -P proto_weights_view.py -- <tag> [mode] [bone]"""
import os, sys
import bpy, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import d01_common as C, d01_render as R, d01_wviz as V
a=C.script_args(); tag=a[0]; mode=a[1] if len(a)>1 else "dominant"; bone=a[2] if len(a)>2 else None
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=C.GLB)
ob=[o for o in bpy.data.objects if o.type=="MESH"][0]
f=C.TARGET_HEIGHT_M/max(v.co.z for v in ob.data.vertices)
for v in ob.data.vertices: v.co*=f
d=np.load(os.path.join(C.WORK,"skin_proto.npz")); W=d["W"]; names=list(d["names"])
if mode=="cls":
    pal={"main":(0.8,0.6,0.5),"helmet":(0.3,0.3,0.9),"horn":(1,1,1),"eye":(0,0,0),"brick":(0.9,0.2,0.2),"sack":(0.2,0.8,0.2),"strap":(1,0.9,0.1),"ear":(0,0.9,0.9),"belt":(0.9,0.1,0.9),"flap_front":(0.5,0.1,0.6),"flap_back":(0.2,0.1,0.3)}
    col=np.array([pal[c] for c in d["cls"]])
else:
    col=V.vertex_colors(W,names,mode,bone)
me=ob.data
ca=me.color_attributes.new("w","FLOAT_COLOR","POINT")
rgba=np.ones((len(col),4)); rgba[:,:3]=col
ca.data.foreach_set("color",rgba.ravel()); me.color_attributes.active_color=ca
sc=R.setup_scene(1400); sc.display.shading.color_type="VERTEX"; sc.display.shading.light="FLAT"
cam=R.make_camera(sc)
views=[("front",(0,0,0.25),0.75),("side",(0,0,0.25),0.75),("back",(0,0,0.25),0.75)]
if os.environ.get("D01_ZOOM"): views=[("front",(0,-0.03,0.39),0.2),("side",(0,-0.03,0.39),0.2),("back",(0,-0.03,0.39),0.2)]
for v,c,s in views:
    R.render_view(cam,v,c,s,os.path.join(C.WORK,f"wv_{tag}_{v}.png"))
