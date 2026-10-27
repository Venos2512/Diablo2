"""Export a finished batch rig with the skill's export_core (skill stage 8) -> <asset>/rig_done/.

blender -b --factory-startup <asset>/rig/<aid>_rig.blend -P export_done.py -- <k>

FBX (Unity), GLB, textures, .blend copy, <aid>_springbones.json (from the editor/spring_layers file next to the
.blend), <aid>_rig_info.json and the reimport check. The skill's code, loaded through rigbatch (k-scaled helpers).
"""
import bpy, sys, os, json
TOOLS = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, TOOLS)
import rigbatch as rb

rc = rb.load_skill(float(sys.argv[sys.argv.index('--') + 1]))
import export_core as ec
rig = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
rep = ec.export_package(rig)
print('EXPORT ' + json.dumps({kk: rep.get(kk) for kk in ('out', 'files', 'reimport_check')}, default=str))
