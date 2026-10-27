"""GUI check helper: keep this Blender off the MCP socket (127.0.0.1:9876 may belong to another session) and show the rig.
blender <file.blend> --python gui_open.py   (also used by rig_editor_safe.py --batch)

Two add-ons serve 9876 here, both auto-started:
- the mcp extension (bl_ext.*.mcp): a timer after a delay, binds with SO_REUSEADDR (on Windows it can share the port
  with a running instance);
- the BlenderMCP add-on (scripts/addons/blender_mcp.py): a timer and every file load, skipped only while the port
  already answers. 2026-10-27: once the other Blender closed, the check window took 9876.
Here: the mcp timer is unregistered, BlenderMCP gets _user_stopped_server = True (what its Disconnect button sets),
and a guard timer stops either server if this session opens one during its first 90 s. Session only: preferences
and the scene's auto-start setting are not changed.

Batch link (127.0.0.1:9899, one JSON line per connection): after the editor's "Ap dung vao Blender" has rebuilt the
.blend on disk, rig_editor_safe.py --batch sends {"cmd": "reload", "file": <this window's .blend>} and the character
is swapped in place from that file: the objects named in it (and stale <asset>_* parts no longer in it) are replaced,
their collections, visibility and pose are carried over, the existing materials/images are reused, and the view, mode,
selection and anything else in the scene stay. "pull" exports the window's rig for the editor ("Tai tu Blender").
Only ping, reload of the window's own file and pull are accepted; no code is run from the socket."""
import bpy, os, sys, json, socket

TOOLS = os.path.dirname(os.path.abspath(__file__))


def _mcp_packages():
    return [n for n, m in list(sys.modules.items()) if n.startswith('bl_ext.') and callable(getattr(m, '_autostart_timer', None))]


def _blendermcp():
    m = sys.modules.get('blender_mcp')
    return m if m is not None and hasattr(m, '_user_stopped_server') else None


for name in _mcp_packages():
    t = sys.modules[name]._autostart_timer
    if bpy.app.timers.is_registered(t):
        bpy.app.timers.unregister(t)
        print('MCP autostart off for this session:', name)
bm = _blendermcp()
if bm is not None:
    bm._user_stopped_server = True
    t = getattr(bm, '_blendermcp_ensure_server_running', None)
    if t is not None and bpy.app.timers.is_registered(t):
        bpy.app.timers.unregister(t)
    print('BlenderMCP auto-start off for this session')

_ticks = [0]


def _guard():
    for name in _mcp_packages():
        srv = sys.modules.get(name + '.mcp_to_blender_server')
        if srv is not None and srv.is_running():
            srv.stop()
            ei = sys.modules.get(name + '.execute_interactive')
            if ei is not None and bpy.app.timers.is_registered(ei.run):
                bpy.app.timers.unregister(ei.run)
            print('MCP server stopped for this session:', name)
    bm = _blendermcp()
    srv = getattr(bpy.types, 'blendermcp_server', None)
    if bm is not None and srv is not None and getattr(srv, 'running', False):
        bm._user_stopped_server = True
        srv.stop()
        print('BlenderMCP server stopped for this session')
    _ticks[0] += 1
    return 0.5 if _ticks[0] < 180 else None


bpy.app.timers.register(_guard, first_interval=0.2, persistent=True)
rig = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
if rig:
    rig.show_in_front = True

# ---------------------------------------------------------------- batch link
LINK_PORT = 9899
MODE_SET = {'POSE': 'POSE', 'PAINT_WEIGHT': 'WEIGHT_PAINT', 'EDIT_MESH': 'EDIT', 'EDIT_ARMATURE': 'EDIT',
            'PAINT_VERTEX': 'VERTEX_PAINT', 'PAINT_TEXTURE': 'TEXTURE_PAINT', 'SCULPT': 'SCULPT'}
SHARED = ('materials', 'node_groups', 'images', 'textures')     # appended copies "<name>.001" -> the window's own


def _view3d():
    for win in bpy.context.window_manager.windows:
        for area in win.screen.areas:
            if area.type == 'VIEW_3D':
                return dict(window=win, area=area, region=next((r for r in area.regions if r.type == 'WINDOW'), None))
    return {}


def _swap(path):
    # Blender will not append from the open file itself: read a copy (same folder, so relative paths still resolve)
    import shutil
    tmp = os.path.join(os.path.dirname(path), '.~reload_' + os.path.basename(path))
    shutil.copyfile(path, tmp)
    try:
        return _swap_from(path, tmp)
    finally:
        os.remove(tmp)


def _swap_from(path, src_file):
    ov = _view3d()
    with bpy.context.temp_override(**ov):
        vl = bpy.context.view_layer; mode = bpy.context.mode; act = vl.objects.active
        act_name = act.name if act else None
        sel = {o.name for o in vl.objects if o.select_get()}
        if mode != 'OBJECT' and act is not None:
            bpy.ops.object.mode_set(mode='OBJECT')     # commits an open edit; the edited object is replaced anyway
    with bpy.data.libraries.load(src_file) as (src, dst):
        names = list(src.objects)
    prefix = os.path.basename(path).rsplit('_rig.blend', 1)[0] + '_'
    old = {n: bpy.data.objects[n] for n in names if n in bpy.data.objects}
    stale = [o for o in bpy.data.objects if o.name.startswith(prefix) and o.name not in names]
    keep = {}
    for n, o in old.items():
        k = keep[n] = dict(cols=list(o.users_collection), hide=o.hide_get(), hide_vp=o.hide_viewport, in_front=o.show_in_front)
        if o.type == 'ARMATURE':
            k['pose'] = {pb.name: (pb.rotation_mode, tuple(pb.location), tuple(pb.rotation_quaternion), tuple(pb.rotation_euler),
                                   tuple(pb.rotation_axis_angle), tuple(pb.scale)) for pb in o.pose.bones}
            k['arm'] = (o.data.pose_position, o.data.display_type, o.data.show_names, o.data.show_axes)
        o.name = n + '__old'                      # free the names so the new copies keep them
        if o.data is not None and o.data.users == 1:
            o.data.name = o.data.name + '__old'
    before = {t: set(getattr(bpy.data, t).keys()) for t in SHARED}
    with bpy.data.libraries.load(src_file) as (src, dst):
        dst.objects = names
    new = {o.name: o for o in dst.objects if o is not None}
    for t in SHARED:
        coll = getattr(bpy.data, t)
        for idb in [x for x in coll if x.name not in before[t]]:
            base, dot, suf = idb.name.rpartition('.')
            if dot and suf.isdigit() and base in before[t]:
                idb.user_remap(coll[base]); coll.remove(idb)
    for n, o in new.items():
        k = keep.get(n)
        for c in (k['cols'] if k else None) or [bpy.context.scene.collection]:
            c.objects.link(o)
        if not k:
            continue
        o.hide_viewport = k['hide_vp']; o.show_in_front = k['in_front']
        try:
            o.hide_set(k['hide'])
        except RuntimeError:                          # collection excluded from the view layer
            pass
        if o.type == 'ARMATURE' and 'pose' in k:
            o.data.pose_position, o.data.display_type, o.data.show_names, o.data.show_axes = k['arm']
            for pb in o.pose.bones:
                p = k['pose'].get(pb.name)
                if p:
                    pb.rotation_mode = p[0]; pb.location = p[1]; pb.rotation_quaternion = p[2]
                    pb.rotation_euler = p[3]; pb.rotation_axis_angle = p[4]; pb.scale = p[5]
    gone = list(old.values()) + stale; datas = [o.data for o in gone if o.data is not None]
    stale_names = [o.name for o in stale]
    for o in gone:
        bpy.data.objects.remove(o, do_unlink=True)
    bpy.data.batch_remove([d for d in datas if d.users == 0])
    with bpy.context.temp_override(**ov):
        vl = bpy.context.view_layer
        vl.update()                                   # resync the bases of the removed objects
        for o in [o for o in vl.objects if o is not None]:
            try:
                o.select_set(o.name in sel)
            except RuntimeError:
                pass
        if act_name in vl.objects:
            vl.objects.active = vl.objects[act_name]
        if MODE_SET.get(mode) and vl.objects.active is not None:
            try:
                bpy.ops.object.mode_set(mode=MODE_SET[mode])
            except RuntimeError as e:
                print('batch link: mode', mode, e)
        try:
            bpy.ops.ed.undo_push(message='Rig batch reload')
        except RuntimeError:
            pass
    return dict(objects=sorted(new), removed=stale_names, mode=mode)


def _pull(k):
    """The editor's "Tai tu Blender": export this window's rig as it is now (bones moved here included), the way
    editor_export.py does, to <blend base>_<Rig>_rig.json; the .blend is not saved."""
    if TOOLS not in sys.path:
        sys.path.insert(0, TOOLS)
    import rigbatch as rb
    rc = rb.load_skill(k)
    rig = next((o for o in bpy.context.scene.objects if o.type == 'ARMATURE'), None)
    if rig is None:
        raise RuntimeError('no armature in the scene')
    with bpy.context.temp_override(**_view3d()):
        if bpy.context.mode.startswith('EDIT'):   # edit-mode changes reach the data only on leaving edit mode
            bpy.ops.object.mode_set(mode='OBJECT'); bpy.ops.object.mode_set(mode='EDIT')
    path = os.path.splitext(bpy.data.filepath)[0] + '_' + rig.name + '_rig.json'
    auto = None
    if os.path.isfile(path):                      # keep the editor's ghost (the skill's first placement)
        with open(path, encoding='utf-8') as f:
            auto = json.load(f).get('auto_joints')
    rc.export_rig_json(rig, path, auto=auto)
    return dict(path=path, rig=rig.name)


def _handle(req):
    here = os.path.normcase(os.path.abspath(bpy.data.filepath)) if bpy.data.filepath else ''
    if req.get('cmd') == 'ping':
        return dict(ok=True, file=bpy.data.filepath, dirty=bpy.data.is_dirty)
    if req.get('cmd') == 'pull':
        if not here:
            return dict(ok=False, error='this window has no file')
        return dict(ok=True, **_pull(float(req.get('k') or 1.0)))
    if req.get('cmd') == 'reload':
        if not here or os.path.normcase(os.path.abspath(str(req.get('file') or ''))) != here:
            return dict(ok=False, error='this window shows ' + (bpy.data.filepath or 'no file'))
        return dict(ok=True, **_swap(bpy.data.filepath))
    return dict(ok=False, error='unknown command')


def _link_tick():
    try:
        conn, _ = _LINK.accept()
    except (BlockingIOError, socket.timeout):
        return 0.25
    except OSError:
        return None
    try:
        conn.settimeout(5); buf = b''
        while not buf.endswith(b'\n') and len(buf) < 65536:
            chunk = conn.recv(4096)
            if not chunk:
                break
            buf += chunk
        try:
            res = _handle(json.loads(buf.decode('utf-8') or '{}'))
        except Exception as e:                    # report to the editor instead of killing the link
            import traceback; traceback.print_exc()
            res = dict(ok=False, error=f'{type(e).__name__}: {e}')
        conn.sendall((json.dumps(res) + '\n').encode('utf-8'))
    except OSError as e:
        print('batch link:', e)
    finally:
        conn.close()
    return 0.25


_LINK = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
try:
    _LINK.bind(('127.0.0.1', LINK_PORT)); _LINK.listen(2); _LINK.setblocking(False)
    bpy.app.timers.register(_link_tick, first_interval=0.5, persistent=True)
    print('batch link on 127.0.0.1:%d' % LINK_PORT)
except OSError as e:
    print('batch link off (port %d busy): %s' % (LINK_PORT, e)); _LINK.close()
