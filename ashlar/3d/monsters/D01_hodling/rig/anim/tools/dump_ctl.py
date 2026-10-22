import bpy, json, sys
sys.path.insert(0, r"E:\Diablo2\ashlar\3d\monsters\D01_hodling\rig\tools")
import d01_rigkit as K
ct=K.control(); rt=K.runtime()
out={"control":{}, "runtime":{}}
for pb in ct.pose.bones:
    b=pb.bone
    cons=[(c.type,getattr(c,'subtarget',None),getattr(c,'target',None) and c.target.name, c.name) for c in pb.constraints]
    out["control"][pb.name]=dict(parent=b.parent.name if b.parent else None, head=list(ct.matrix_world@b.head_local), tail=list(ct.matrix_world@b.tail_local), cons=cons, lockrot=[pb.lock_rotation[:],pb.lock_location[:]], rotmode=pb.rotation_mode,
       mat=[list(r) for r in (ct.matrix_world@b.matrix_local)], props=list(pb.keys()))
for pb in rt.pose.bones:
    b=pb.bone
    out["runtime"][pb.name]=dict(parent=b.parent.name if b.parent else None, head=list(rt.matrix_world@b.head_local), tail=list(rt.matrix_world@b.tail_local), cons=[(c.type,c.subtarget) for c in pb.constraints], deform=b.use_deform)
out["ct_props"]={k:ct[k] for k in ct.keys() if isinstance(ct[k],(int,float))}
out["scene"]=dict(fps=bpy.context.scene.render.fps, fs=bpy.context.scene.frame_start, fe=bpy.context.scene.frame_end, objs=[(o.name,o.type,o.hide_viewport,o.hide_get()) for o in bpy.data.objects], actions=[a.name for a in bpy.data.actions], ver=bpy.app.version_string)
out["drivers"]=[(d.data_path) for d in (ct.animation_data.drivers if ct.animation_data else [])]
json.dump(out,open(r"E:\Diablo2\ashlar\3d\monsters\D01_hodling\rig\anim\_work\ctl_dump.json","w"),indent=1)
print("OK")
