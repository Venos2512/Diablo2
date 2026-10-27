"""B01 GUI check, session only. Run after the rig_v1 check-window guard (keeps this Blender off 127.0.0.1:9876):
  blender B01_sextons_dog_rig.blend --python <_batches/rig_v1/tools/gui_open.py> --python b01_gui_check.py
Frames the dog (3/4 front-left), puts B01_control in Pose Mode and adds a sidebar tab "B01" (N panel) with the ik_*
switches and the QA test poses of b01_poses.py. Nothing is written to disk and the tab is gone when Blender closes;
a pose applied here reaches the .blend only if the window saves it ("rest" puts the rig back first)."""
import bpy, os, sys
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import b01_poses as P

CTL = 'B01_control'
SWITCHES = ('ik_arm_L', 'ik_arm_R', 'ik_leg_L', 'ik_leg_R')
VIEW = dict(location=(0.0, 0.0, 0.62), direction=(0.75, -0.55, 0.36), distance=4.2)   # viewer side; left = +X


def _refresh(context, cr):
    # ik_* set from Python do not tag the drivers that read them (same as in validation)
    cr.update_tag()
    context.scene.frame_set(context.scene.frame_current)


class B01_OT_test_pose(bpy.types.Operator):
    """Reset B01_control (IK on) and apply one QA test pose"""
    bl_idname = 'b01.test_pose'
    bl_label = 'B01 test pose'
    bl_options = {'REGISTER', 'UNDO'}
    pose: bpy.props.StringProperty()

    @classmethod
    def poll(cls, context):
        return CTL in bpy.data.objects

    def execute(self, context):
        cr = bpy.data.objects[CTL]
        for p in SWITCHES:
            cr[p] = 1.0
        _refresh(context, cr)
        P.apply(cr, self.pose)
        _refresh(context, cr)
        return {'FINISHED'}


class B01_PT_check(bpy.types.Panel):
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = 'B01'
    bl_label = 'B01 check'

    def draw(self, context):
        cr = bpy.data.objects.get(CTL)
        if cr is None:
            self.layout.label(text='no ' + CTL)
            return
        col = self.layout.column(align=True)
        col.label(text='IK / FK (1 = IK)')
        for p in SWITCHES:
            col.prop(cr, '["%s"]' % p, slider=True)
        self.layout.label(text='QA test poses (G2)')
        grid = self.layout.grid_flow(columns=2, even_columns=True, align=True)
        for name in P.POSES:
            grid.operator(B01_OT_test_pose.bl_idname, text=name).pose = name


def _setup():
    win = bpy.context.window_manager.windows[0]
    areas = [a for a in win.screen.areas if a.type == 'VIEW_3D']
    for area in areas:
        r3 = area.spaces.active.region_3d
        r3.view_perspective = 'PERSP'
        r3.view_location = VIEW['location']
        r3.view_rotation = Vector(VIEW['direction']).to_track_quat('Z', 'Y')
        r3.view_distance = VIEW['distance']
    cr = bpy.data.objects.get(CTL)
    if cr is not None and areas:
        region = next(r for r in areas[0].regions if r.type == 'WINDOW')
        with bpy.context.temp_override(window=win, area=areas[0], region=region):
            if bpy.context.mode == 'OBJECT':
                for o in bpy.context.view_layer.objects:
                    o.select_set(o is cr)
                bpy.context.view_layer.objects.active = cr
                bpy.ops.object.mode_set(mode='POSE')
                bpy.ops.pose.select_all(action='DESELECT')
    print('B01 check: view set, %s in %s, sidebar tab "B01"' % (CTL, cr.mode if cr else '-'))
    return None


for cls in (B01_OT_test_pose, B01_PT_check):
    bpy.utils.register_class(cls)
bpy.app.timers.register(_setup, first_interval=0.5)
