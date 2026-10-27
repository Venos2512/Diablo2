"""B01 R1 (G1 proposal): build the proposed runtime skeleton in memory, check it against the mesh and render
the joint-over-mesh views for the brief. Nothing is saved as the rig file.

blender -b --factory-startup -P b01_r1_proposal.py

Writes rig/_work/prop_*.png (+ _bones.png passes, _cam.json), rig/_work/prop_labels.json (2D joint positions per view),
rig/_work/prop_checks.json (mesh symmetry, joints inside the mesh, bone lengths) and rig/landmarks.json.
"""
import bpy, bmesh, sys, os, json, math
from mathutils import Vector, Matrix, kdtree
from mathutils.bvhtree import BVHTree
from bpy_extras.object_utils import world_to_camera_view

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import b01_common as C
import b01_skel as S
C.tools_path()
import rigbatch as rb

C.texture_limit(1024)
ob, info = C.intake()
me = ob.data

# ---- armature from the spec
arm = bpy.data.armatures.new('B01_proposal_data'); rig = bpy.data.objects.new('B01_proposal', arm)
bpy.context.scene.collection.objects.link(rig); bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode='EDIT')
for name, parent, h, t, rref, deform, conn in S.bones():
    eb = arm.edit_bones.new(name); eb.head = Vector(h); eb.tail = Vector(t)
    eb.align_roll(Vector(rref)); eb.use_deform = deform
for name, parent, h, t, rref, deform, conn in S.bones():
    if parent:
        eb = arm.edit_bones[name]; eb.parent = arm.edit_bones[parent]; eb.use_connect = conn
bpy.ops.object.mode_set(mode='OBJECT')

# ---- checks: mirror symmetry of the mesh, joints inside the mesh (3-ray parity), depth to the surface
V = [v.co.copy() for v in me.vertices]
kd = kdtree.KDTree(len(V))
for i, p in enumerate(V):
    kd.insert(p, i)
kd.balance()
dm = sorted(kd.find(Vector((-p.x, p.y, p.z)))[2] for p in V)
sym = dict(max_mm=round(1000 * dm[-1], 3), p99_mm=round(1000 * dm[int(0.99 * len(dm))], 3), mean_mm=round(1000 * sum(dm) / len(dm), 4))

bm = bmesh.new(); bm.from_mesh(me); bvh = BVHTree.FromBMesh(bm); bm.free()


def inside(p):
    votes = 0
    for d in (Vector((0.31, 0.53, 0.79)), Vector((-0.62, 0.21, -0.75)), Vector((0.11, -0.97, 0.2))):
        n = 0; q = Vector(p); d = d.normalized()
        for _ in range(64):
            hit = bvh.ray_cast(q, d)
            if hit[0] is None:
                break
            n += 1; q = hit[0] + d * 1e-5
        votes += n % 2
    return votes >= 2


joints = {}
for name, parent, h, t, rref, deform, conn in S.bones():
    p = Vector(h); loc, nrm, fi, dist = bvh.find_nearest(p)
    joints[name] = dict(head=[round(c, 4) for c in h], inside=inside(p), surface_mm=round(1000 * dist, 1),
                        length=round((Vector(t) - Vector(h)).length, 4), deform=deform)
bad = [n for n, r in joints.items() if r['deform'] and not r['inside']]
checks = dict(info=info, symmetry=sym, joints=joints, deform_heads_outside=bad,
              n_bones=len(S.bones()), n_deform=sum(1 for b in S.bones() if b[5]))
C.jdump(os.path.join(C.WORK, 'prop_checks.json'), checks)
print('[b01] symmetry', sym, 'outside', bad)

# ---- renders: X-ray mesh + bone proxy pass per view, textured close-ups
proxy = rb.bone_proxy(rig, posed=False, scale=1.3)
cam = rb.setup_render(1200)
scn = bpy.context.scene
lo, hi = rb.frame_box([ob])
labels = {}


def cam_top(c, lo, hi, size=None):
    c.data.type = 'ORTHO'; e = hi - lo
    c.data.ortho_scale = size or max(e.x, e.y) * 1.06
    c.location = ((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, hi.z + 5); c.rotation_euler = (0, 0, math.pi)


def project(tag):
    bpy.context.view_layer.update()
    out = {}
    for b in rig.data.bones:
        p = rig.matrix_world @ b.head_local
        u, v, d = world_to_camera_view(scn, cam, p)
        out[b.name] = [round(u, 4), round(v, 4)]
    labels[tag] = out


def two_pass(tag, xray_alpha=0.30, tex=False):
    sh = scn.display.shading
    rb.only_visible([ob])
    if tex:
        rb.shading('TEXTURE', xray=True, alpha=0.55)
    else:
        sh.color_type = 'SINGLE'; sh.single_color = (0.80, 0.78, 0.74); sh.show_xray = True; sh.xray_alpha = xray_alpha
    rb.render_to(os.path.join(C.WORK, f'prop_{tag}.png'))
    rb.only_visible([proxy]); rb.shading('VERTEX', xray=False)
    rb.render_to(os.path.join(C.WORK, f'prop_{tag}_bones.png'))
    project(tag)
    for o in scn.objects:
        o.hide_render = False
    sh.show_xray = False


for v in ('left', 'front', 'back'):
    rb.place_camera(cam, lo, hi, v, margin=1.06); two_pass(v)
cam_top(cam, lo, hi); two_pass('top')
# close-ups (textured, x-ray 0.55): head side / front, front leg side, hind leg side
for tag, view, c, size in (('head_left', 'left', (0, -0.84, 0.92), 0.62), ('head_front', 'front', (0, -0.84, 0.92), 0.70),
                           ('fleg_left', 'left', (0.2, -0.40, 0.58), 1.25), ('hleg_left', 'left', (0.2, 0.62, 0.55), 1.20),
                           ('fleg_front', 'front', (0, -0.40, 0.55), 1.10), ('hleg_back', 'back', (0, 0.62, 0.55), 1.10)):
    rb.place_camera(cam, lo, hi, view, center=Vector(c), size=size); two_pass(tag, tex=True)
C.jdump(os.path.join(C.WORK, 'prop_labels.json'), labels)

# ---- landmarks.json (the numbers behind the proposal; R2 reads the same spec)
C.jdump(C.LANDMARKS, dict(asset=C.AID, units='m', scale_from_glb=info['scale'], length_m=info['length_m'],
                          height_m=round(info['height_m'], 4), facing='-Y (glTF +Z)', left='+X',
                          source='rig/scripts/b01_skel.py J (read from exact plane sections rig/_work/sec_*.png)',
                          joints={k: list(v) for k, v in S.J.items()}, symmetry=sym))
print('B01_PROPOSAL_DONE')
