"""P03 Hush-Moths R2 + R3: runtime skeleton (variant A) + control rig + skin -> rig/P03_hush_moths_rig.blend.

blender -b --factory-startup -P p03_build_rig.py -- [height_m]

Rebuilds everything from the GLB (read only). Landmarks are measured again (p03_skeleton.landmarks), so the result is the
skeleton approved at G1 (2026-10-26). Writes rig/landmarks.json, rig/_work/build_report.json.
"""
import bpy, sys, os, json, math
import numpy as np
from mathutils import Vector, Matrix
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import p03_common as pc  # noqa: E402
import p03_skeleton as sk  # noqa: E402
import p03_skin as skin  # noqa: E402
rb = pc.rb

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
H = float(argv[0]) if argv else pc.HEIGHT_DEFAULT
RIG = pc.ADIR + '/rig'
BLEND = RIG + '/P03_hush_moths_rig.blend'
os.makedirs(RIG + '/_work', exist_ok=True)

M = pc.Moth(H)
LM = sk.landmarks(M)
A = sk.bones_A(LM)
with open(RIG + '/landmarks.json', 'w') as f:
    json.dump(dict(asset=pc.ASSET, height_m=H, scale_glb_to_m=M.S, note='Blender metres, facing -Y, moth left = +X; R = mirror of L',
                   landmarks=sk.lm_json(LM)), f, indent=1)

scn = bpy.context.scene
scn.render.fps = 24
cols = {}
for n in ('Mesh', 'Runtime', 'Control'):
    c = bpy.data.collections.new(n); scn.collection.children.link(c); cols[n] = c

# ------------------------------------------------------------------ runtime skeleton
rig = sk.build_armature(A, name='P03_hush_moths_rig', collection=cols['Runtime'])
rig.data.display_type = 'STICK'
arm = rig.data
bc_def = arm.collections.new('Deform'); bc_sock = arm.collections.new('Sockets'); bc_core = arm.collections.new('Root_COG')
for b in A:
    (bc_sock if b['group'] == 'socket' else bc_core if b['group'] == 'core' else bc_def).assign(arm.bones[b['name']])
rig['asset'] = pc.ASSET; rig['height_m'] = H; rig['scale_glb_to_m'] = M.S
rig['variant'] = 'A (full); B = collapse at export, see variant_B_*'
rig['variant_B_collapse'] = json.dumps(sk.B_COLLAPSE); rig['variant_B_drop_sockets'] = json.dumps(sk.B_DROP_SOCKETS)

# ------------------------------------------------------------------ control rig
C, poles = sk.ctl_bones(A, LM)
ctl = sk.build_armature(C, name='P03_hush_moths_ctl', collection=cols['Control'])
ctl.data.display_type = 'OCTAHEDRAL'; ctl.show_in_front = True
carm = ctl.data
GROUPS = {'Root_COG': ('core',), 'Body': ('body', 'head', 'abdomen'), 'Antennae': ('antenna',), 'Wings': ('wingF', 'wingB', 'wing_master'),
          'Legs_FK': ('leg1', 'leg2', 'leg3'), 'Legs_IK': ('leg_ik',)}
PAL = {'Root_COG': 'THEME09', 'Body': 'THEME02', 'Antennae': 'THEME06', 'Wings': 'THEME03', 'Legs_FK': 'THEME01', 'Legs_IK': 'THEME04'}
for gname, gs in GROUPS.items():
    bc = carm.collections.new(gname)
    for c in C:
        if c['group'] in gs:
            bc.assign(carm.bones[c['name']]); carm.bones[c['name']].color.palette = PAL[gname]
for pb in ctl.pose.bones:
    pb.rotation_mode = 'XYZ'

# runtime follows control (rest identical, so no offset)
for pb in rig.pose.bones:
    t = 'ctl_' + pb.name
    if t in ctl.pose.bones:
        c = pb.constraints.new('COPY_TRANSFORMS'); c.name = 'FromCtl'; c.target = ctl; c.subtarget = t
        c.owner_space = c.target_space = 'WORLD'

# wing flap: ctl_wings X -> both masters (local X = +up on both sides), like a parent rotation
for side in ('L', 'R'):
    c = ctl.pose.bones[f'ctl_{side}_Wing'].constraints.new('COPY_ROTATION'); c.name = 'FlapBoth'
    c.target = ctl; c.subtarget = 'ctl_wings'; c.use_x = True; c.use_y = False; c.use_z = False
    c.owner_space = c.target_space = 'LOCAL'; c.mix_mode = 'BEFORE'
# abdomen curl: the curl control's local rotation added to each segment
for k in (1, 2, 3):
    c = ctl.pose.bones[f'ctl_abdomen_0{k}'].constraints.new('COPY_ROTATION'); c.name = 'Curl'
    c.target = ctl; c.subtarget = 'ctl_abdomen_curl'; c.owner_space = c.target_space = 'LOCAL'; c.mix_mode = 'BEFORE'


def drive(con, prop):
    fc = con.driver_add('influence'); d = fc.driver; d.type = 'AVERAGE'
    v = d.variables.new(); v.name = 'ik'; v.type = 'SINGLE_PROP'
    v.targets[0].id_type = 'OBJECT'; v.targets[0].id = ctl; v.targets[0].data_path = f'["{prop}"]'


def signed_angle(u, v, normal):
    a = u.angle(v)
    if u.cross(v).angle(normal) < 1:
        a = -a
    return a


ik_report = {}
for side in ('L', 'R'):
    for n in (1, 2, 3):
        prop = f'ik_leg_{side}{n}'
        ctl[prop] = 1.0
        ctl.id_properties_ui(prop).update(min=0.0, max=1.0, soft_min=0.0, soft_max=1.0, description=f'1 = IK, 0 = FK ({side}_Leg{n})')
        b01 = carm.bones[f'ctl_{side}_Leg{n}_01']; b02 = carm.bones[f'ctl_{side}_Leg{n}_02']
        pole = Vector(poles[f'{side}_Leg{n}'])
        pn = (b02.tail_local - b01.head_local).cross(pole - b01.head_local)
        pax = pn.cross(b01.tail_local - b01.head_local)
        ang = signed_angle(b01.matrix_local.to_3x3().col[0], pax, b01.tail_local - b01.head_local)
        pb2 = ctl.pose.bones[f'ctl_{side}_Leg{n}_02']
        ik = pb2.constraints.new('IK'); ik.name = 'LegIK'; ik.target = ctl; ik.subtarget = f'ctl_{side}_Leg{n}_IK'
        ik.pole_target = ctl; ik.pole_subtarget = f'ctl_{side}_Leg{n}_pole'; ik.chain_count = 2; ik.pole_angle = ang
        drive(ik, prop)
        cr = ctl.pose.bones[f'ctl_{side}_Leg{n}_03'].constraints.new('COPY_ROTATION'); cr.name = 'FootFromIK'
        cr.target = ctl; cr.subtarget = f'ctl_{side}_Leg{n}_IK'; cr.owner_space = cr.target_space = 'WORLD'
        drive(cr, prop)

        # verify the rest pose with IK on; refine the pole angle numerically if needed
        def err(a):
            ik.pole_angle = a; bpy.context.view_layer.update()
            e = 0.0
            for nm in (f'ctl_{side}_Leg{n}_01', f'ctl_{side}_Leg{n}_02'):
                Mp = ctl.pose.bones[nm].matrix; Mr = carm.bones[nm].matrix_local
                e = max(e, (Mp.translation - Mr.translation).length, (Mp.col[0].xyz - Mr.col[0].xyz).length * 0.05,
                        ((Mp @ Vector((0, carm.bones[nm].length, 0, 1))).xyz - (Mr @ Vector((0, carm.bones[nm].length, 0, 1))).xyz).length)
            return e
        e0 = err(ang)
        best = (e0, ang)
        if e0 > 2e-4:
            for d in range(-180, 181, 2):
                a = math.radians(d); e = err(a)
                if e < best[0]:
                    best = (e, a)
            for k in range(-20, 21):
                a = best[1] + math.radians(k * 0.1); e = err(a)
                if e < best[0]:
                    best = (e, a)
        ik.pole_angle = best[1]; bpy.context.view_layer.update()
        ik_report[f'{side}_Leg{n}'] = dict(pole_angle_deg=round(math.degrees(best[1]), 2), rest_error_mm=round(best[0] * 1000, 4),
                                           formula_error_mm=round(e0 * 1000, 4))

# ------------------------------------------------------------------ mesh + skin
ob = M.ob
ob.name = pc.ASSET; ob.data.name = pc.ASSET + '_mesh'
for c in list(ob.users_collection):
    c.objects.unlink(ob)
cols['Mesh'].objects.link(ob)
ob.parent = rig; ob.matrix_parent_inverse = Matrix.Identity(4)
mod = ob.modifiers.new('Armature', 'ARMATURE'); mod.object = rig; mod.use_vertex_groups = True
W, names, srep = skin.compute(M, LM, A)
skin.write_groups(ob, W, names)
np.save(RIG + '/_work/weights_A.npy', W)
with open(RIG + '/_work/weights_names.json', 'w') as f:
    json.dump(names, f)
for v in ob.data.color_attributes[:]:
    ob.data.color_attributes.remove(v)

# rest check: evaluated mesh == input positions
bpy.context.view_layer.update()
P = np.array(rb.evaluated_world(ob))
rest_dev = float(np.abs(P - M.CO).max())

# README for the animator, inside the file
txt = bpy.data.texts.new('README_P03_rig')
txt.write(
    'P03 Hush-Moths rig (R2-R3, 2026-10-26). Runtime: P03_hush_moths_rig (deform + sockets, goes to the GLB at R8).\n'
    'Animate P03_hush_moths_ctl only; runtime bones copy it (Copy Transforms) and are baked at R8.\n'
    '- ctl_wings: X = flap both sides (+ = up). ctl_L_Wing / ctl_R_Wing: per-side flap at the shared hinge (+X = up),\n'
    '  parents of ctl_*_WingF_01 and ctl_*_WingB_01 so both wing layers move as one. *_02 = outer wing flex.\n'
    '- ctl_abdomen_curl: adds its rotation to every abdomen segment (X = curl, Z = side bend).\n'
    '- Legs: ctl_*_Leg<n>_IK (ankle, foot = its tail) + _pole; custom props ik_leg_L1..R3 on this object (1 IK, 0 FK).\n'
    '  Leg bones: +X = flex (both sides). Flight clips: set ik_leg_* to 0 and pose the FK legs.\n'
    '- Variant B (swarm) is made at export: weights of the bones in rig["variant_B_collapse"] go to their parents.\n')

for scr in bpy.data.screens:
    for area in scr.areas:
        if area.type == 'VIEW_3D':
            for sp in area.spaces:
                if sp.type == 'VIEW_3D':
                    sp.shading.type = 'SOLID'; sp.shading.color_type = 'TEXTURE'
for o in bpy.context.view_layer.objects:
    o.select_set(False)
bpy.context.view_layer.objects.active = ctl

rep = dict(height_m=H, scale=M.S, bones_runtime=len(A), deform=len(names), ctl_bones=len(C), ik=ik_report, skin=srep,
           rest_deviation_m=rest_dev, verts=M.N)
with open(RIG + '/_work/build_report.json', 'w') as f:
    json.dump(rep, f, indent=1)
rb.save(BLEND)
print('BUILD_DONE', json.dumps(dict(rest_dev=rest_dev, ik=ik_report, unassigned=srep['unassigned'],
                                    coincident=srep['coincident_groups'], cross=srep['coincident_cross_island'],
                                    maxinf=srep['max_influences'])))
