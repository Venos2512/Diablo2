"""Export a rigged asset for the skill's rig editor (tools/rig_editor), without the MCP socket.

blender -b --factory-startup <asset>/rig/<id>_rig.blend -P editor_export.py -- <k>

Writes <blend base>_<Rig>_rig.json (+ _rig_tex/) next to the .blend with rc.export_rig_json (the same file the
editor's "Tai tu Blender" button makes) and saves the .blend so rig['auto_joints'] is kept.
"""
import bpy, sys, os
TOOLS = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, TOOLS)
import rigbatch as rb

k = float(sys.argv[sys.argv.index('--') + 1])
rc = rb.load_skill(k)
rig = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
base = os.path.splitext(bpy.data.filepath)[0]
path = base + '_' + rig.name + '_rig.json'
auto = None
if os.path.isfile(path):          # keep the editor's ghost = the skill's first placement, across rebuilds
    import json
    with open(path, encoding='utf-8') as f:
        auto = json.load(f).get('auto_joints')
rc.export_rig_json(rig, path, auto=auto)
rb.save(bpy.data.filepath)
print('EDITOR_JSON', path)
