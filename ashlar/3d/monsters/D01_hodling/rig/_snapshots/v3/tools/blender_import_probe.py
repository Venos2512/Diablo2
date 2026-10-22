"""Probe chi-doc: import GLB vao scene trong cua Blender, in so do ra JSON. Khong luu .blend, khong render, khong sua GLB.

Chay:  blender -b --factory-startup -P blender_import_probe.py -- <glb> <out.json>
"""
import json
import sys

import bpy

argv = sys.argv[sys.argv.index("--") + 1:]
glb, out = argv[0], argv[1]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)

res = {"blender": bpy.app.version_string, "objects": [], "armatures": 0, "actions": len(bpy.data.actions),
       "images": [{"name": i.name, "size": list(i.size), "source": i.source} for i in bpy.data.images]}
for o in bpy.data.objects:
    e = {"name": o.name, "type": o.type, "parent": o.parent.name if o.parent else None,
         "location": [round(v, 6) for v in o.location], "rotation_mode": o.rotation_mode,
         "rotation_euler": [round(v, 6) for v in o.rotation_euler],
         "rotation_quaternion": [round(v, 6) for v in o.rotation_quaternion],
         "scale": [round(v, 6) for v in o.scale],
         "dimensions": [round(v, 6) for v in o.dimensions]}
    if o.type == "ARMATURE":
        res["armatures"] += 1
    if o.type == "MESH":
        me = o.data
        me.calc_loop_triangles()
        e.update(vertices=len(me.vertices), polygons=len(me.polygons), loop_triangles=len(me.loop_triangles),
                 materials=[m.name if m else None for m in me.materials], uv_layers=[u.name for u in me.uv_layers],
                 vertex_groups=len(o.vertex_groups), modifiers=[m.type for m in o.modifiers],
                 shape_keys=bool(me.shape_keys))
        zs = [(o.matrix_world @ v.co) for v in me.vertices]
        e["world_bbox_min"] = [round(min(p[k] for p in zs), 6) for k in range(3)]
        e["world_bbox_max"] = [round(max(p[k] for p in zs), 6) for k in range(3)]
    res["objects"].append(e)

with open(out, "w", encoding="utf-8", newline="\n") as f:
    json.dump(res, f, ensure_ascii=False, indent=2)
    f.write("\n")
print("probe ->", out)
