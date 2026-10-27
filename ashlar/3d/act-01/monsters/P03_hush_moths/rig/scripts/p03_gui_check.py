"""P03 check window, two uses.

  blender -b --factory-startup rig/P03_hush_moths_rig.blend -P p03_gui_check.py
      writes rig/_work/P03_hush_moths_rig_check.blend: the rig file as it is, plus action P03_QA_poses on the control
      rig (the 21 R4/R5 test poses of p03_qa.POSES, each rest -> pose -> hold -> rest over 11 frames, one timeline marker
      per pose), the 3D views framed on the moth and the control rig in pose mode. The rig file itself is not written.

  blender rig/_work/P03_hush_moths_rig_check.blend --python p03_gui_check.py
      GUI: runs rig_v1/tools/gui_open.py (keeps this Blender off the MCP port 9876), then closes its batch link on 9899:
      P03 does not use it, and another thread's rig editor may be talking to its own window on that port.
"""
import bpy, os, sys, math, runpy

HERE = os.path.dirname(os.path.abspath(__file__))
RIGDIR = os.path.dirname(HERE)
CHECK = os.path.join(RIGDIR, '_work', 'P03_hush_moths_rig_check.blend')
LOG = os.path.join(RIGDIR, '_work', 'gui_check.log')
GUI_OPEN = r'D:\Claude\Diablo2\ashlar\3d\act-01\_batches\rig_v1\tools\gui_open.py'
STEP, RAMP, HOLD = 11, 4, 3          # frames per pose: rest at 0, pose at RAMP, held to RAMP + HOLD, rest at STEP


def log(*a):
    with open(LOG, 'a', encoding='utf-8') as f:
        f.write(' '.join(str(x) for x in a) + '\n')
    print(*a)


def build():
    sys.dont_write_bytecode = True
    sys.path.insert(0, HERE)
    import p03_qa as Q
    from mathutils import Euler
    sc = bpy.context.scene
    ctl = bpy.data.objects['P03_hush_moths_ctl']
    specs = [(n, p) for n, p in Q.POSES.items() if n != 'rest']
    rot_b = sorted({b for _, p in specs for b, (r, o) in p.get('bones', {}).items() if r is not None})
    loc_b = sorted({b for _, p in specs for b, (r, o) in p.get('bones', {}).items() if o is not None})

    def key(f):
        for b in rot_b:
            ctl.pose.bones[b].keyframe_insert('rotation_euler', frame=f, group=b)
        for b in loc_b:
            ctl.pose.bones[b].keyframe_insert('location', frame=f, group=b)
        for k in Q.IK_OFF:
            ctl.keyframe_insert('["%s"]' % k, frame=f, group='IK switches')

    sc.timeline_markers.clear()
    for i, (name, spec) in enumerate(specs):
        f0 = 1 + i * STEP
        Q.clear(ctl); key(f0)
        Q.apply(ctl, spec); key(f0 + RAMP); key(f0 + RAMP + HOLD)
        sc.timeline_markers.new(name, frame=f0 + RAMP)
    end = 1 + len(specs) * STEP
    Q.clear(ctl); key(end)
    ctl.animation_data.action.name = 'P03_QA_poses'
    sc.frame_start, sc.frame_end = 1, end
    sc.frame_set(1)

    for scr in bpy.data.screens:
        for ar in scr.areas:
            if ar.type != 'VIEW_3D':
                continue
            sp = ar.spaces[0]
            sp.shading.type = 'SOLID'; sp.shading.color_type = 'TEXTURE'
            sp.show_region_ui = True
            r3d = sp.region_3d
            if r3d is not None:
                r3d.view_perspective = 'PERSP'
                r3d.view_location = (0.0, -0.02, 0.36)
                r3d.view_rotation = Euler((math.radians(68), 0.0, math.radians(35)), 'XYZ').to_quaternion()
                r3d.view_distance = 2.6
    vl = bpy.context.view_layer
    for o in vl.objects:
        o.select_set(False)
    ctl.select_set(True); vl.objects.active = ctl
    bpy.ops.object.mode_set(mode='POSE')
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=CHECK, copy=True)
    log('built', CHECK, '| poses', len(specs), '| frames 1-%d' % end, '| rot bones', len(rot_b), '| loc bones', len(loc_b))


def gui():
    g = runpy.run_path(GUI_OPEN)
    tick, link = g.get('_link_tick'), g.get('_LINK')
    if tick is not None and bpy.app.timers.is_registered(tick):
        bpy.app.timers.unregister(tick)
    if link is not None:
        link.close()
    left = [n for n in g['_mcp_packages']() if bpy.app.timers.is_registered(sys.modules[n]._autostart_timer)]
    bm = g['_blendermcp']()
    log('gui pid', os.getpid(), bpy.data.filepath, '| mcp autostart timers left:', left,
        '| BlenderMCP stopped:', None if bm is None else bm._user_stopped_server, '| batch link closed')


if bpy.app.background:
    build()
else:
    gui()
