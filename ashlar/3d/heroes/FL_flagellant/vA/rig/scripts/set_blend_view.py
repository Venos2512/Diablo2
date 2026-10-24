"""Packaging helper: make the saved .blend open on a readable textured viewport (Layout workspace), framed on the character.

  blender -b <rig>.blend -P set_blend_view.py            (re-saves the same file; nothing else is touched)

Skill blender-game-animation: 'save a readable textured viewport and verify it after reopening'.
Layout viewport: solid shading with TEXTURE colour, 3/4 front view of the 1.8 m character (faces -Y). Pose stays at rest.
"""
import bpy, math
from mathutils import Euler, Vector

for scr in bpy.data.screens:
    if scr.name != 'Layout':
        continue
    for a in scr.areas:
        if a.type != 'VIEW_3D':
            continue
        sp = a.spaces.active
        sp.shading.type = 'SOLID'
        sp.shading.light = 'STUDIO'
        sp.shading.color_type = 'TEXTURE'
        rv = sp.region_3d
        rv.view_perspective = 'PERSP'
        rv.view_location = Vector((0.0, 0.0, 0.9))
        rv.view_distance = 4.2
        rv.view_rotation = Euler((math.radians(84), 0.0, math.radians(-28)), 'XYZ').to_quaternion()
bpy.ops.wm.save_mainfile()
print('SAVED_VIEW', bpy.data.filepath)
