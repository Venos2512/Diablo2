"""W07 bone table (runtime skeleton) from the measured joints (py -3.11 -I w07_spec.py [--orphans legs|remove]).

Inputs: rig/_work/joints.json (w07_joints.py), rig/_work/landmarks.json (w07_landmarks.py: body landmarks).
Output: rig/_work/rig_spec.json - bones (head, tail, parent, deform, z_axis hint for the roll), side bones mirrored
from the +X measurement (mirror average of both sides). Blender frame: Z up, the spider faces -Y, its left = +X.

Roll convention (same as W04 Mire-Sucker): legs and palps have local X = hinge axis (normal of the limb plane),
+X rotation = more flexion, on both sides (right side = Blender X-mirror of the left); body bones have local
X ~ world +X (rotation about X = pitch).
"""
import os, sys, json
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
WORK = os.path.join(os.path.dirname(HERE), '_work')
J = json.load(open(os.path.join(WORK, 'joints.json')))
LM = json.load(open(os.path.join(WORK, 'landmarks.json')))
ORPHANS = 'remove'
if '--orphans' in sys.argv:
    ORPHANS = sys.argv[sys.argv.index('--orphans') + 1]


def v(x):
    return np.array(x, dtype=float)


def nrm(x):
    return x / np.linalg.norm(x)


def mir(p):
    p = v(p).copy(); p[0] *= -1; return p


def sym_pt(name, key):
    o = J[name]['order']; return v(J[name]['sym'][o.index(key)])


B = []


def bone(name, head, tail, parent, deform=True, z=None, group='body', note=''):
    head = v(head); tail = v(tail)
    if z is None:                                  # default: local X ~ world +X
        y = nrm(tail - head); x = np.array([1.0, 0, 0])
        if abs(x @ y) > 0.95:
            x = np.array([0, -1.0, 0]) if y[2] > 0 else np.array([0, 1.0, 0])
        z = np.cross(x, y)
    B.append(dict(name=name, head=head.round(4).tolist(), tail=tail.round(4).tolist(), parent=parent, deform=deform,
                  z=nrm(v(z)).round(5).tolist(), group=group, note=note,
                  length=round(float(np.linalg.norm(tail - head)), 4)))


body = LM['body']
socket_c = v(body['leg_socket_center'])                              # centre of the leg roots (sternum)
cog_h = np.array([0.0, socket_c[1], 0.70])
ceph_front = v(body['ceph_front'])
ab_c = v(body['abdomen_center']); ab_c[0] = 0.0
spin = v(body['spinneret_tip']); spin[0] = 0.0
ped = np.array([0.0, v(body['ceph_mid_back'])[1], v(body['ceph_mid_back'])[2]])   # back end of the cephalothorax
ab2_h = ab_c + 0.55 * (spin - ab_c)

bone('root', [0, 0, 0], [0, 0, 0.25], None, deform=False, z=[0, -1, 0], group='root')
bone('cog', cog_h, cog_h + [0, 0, 0.20], 'root', deform=False, z=[0, -1, 0], group='root')
bone('cephalothorax', cog_h, [0, ceph_front[1] + 0.05, 0.78], 'cog', note='head plate, sternum, eyes, palp coxae, face lumps')
bone('abdomen_01', ped, ab_c, 'cephalothorax', note='whole abdomen ball (pivot at the back of the cephalothorax)')
bone('abdomen_02', ab2_h, spin, 'abdomen_01', note='rear-bottom cap around the spinneret')

# fangs (one blade each, hanging under the face)
fr = J.get('fang')
fl = LM['sym']['fang']                                               # [root, tip] mirror average (+X side)
bone('L_fang', fl[0], fl[1], 'cephalothorax', z=[0, -1, 0], group='head')

# palps: base -> top joint -> tip (claw rigid with _02)
pb, pt, ptip = sym_pt('palp', 'base'), sym_pt('palp', 'top'), sym_pt('palp', 'tip')
n_p = nrm(np.cross(pt - pb, ptip - pt))
if n_p[0] < 0:
    n_p = -n_p
for nm, h, t, par in (('L_Palp_01', pb, pt, 'cephalothorax'), ('L_Palp_02', pt, ptip, 'L_Palp_01')):
    y = nrm(t - h); x = nrm(n_p - (n_p @ y) * y); bone(nm, h, t, par, z=np.cross(x, y), group='palp')

# legs: _01 coxa (root -> coxa/femur collar), _02 femur (-> knee), _03 tibia (-> ring collar), _04 tarsus (-> tip)
knob = sym_pt('Leg1', 'root')
for i, name in enumerate(('Leg1', 'Leg2', 'Leg3', 'Leg4'), start=1):
    root = knob if name == 'Leg2' else sym_pt(name, 'root')
    coxa = sym_pt(name, 'root') if name == 'Leg2' else sym_pt(name, 'coxa')
    knee, ring, tip = sym_pt(name, 'knee'), sym_pt(name, 'ring'), sym_pt(name, 'tip')
    n = nrm(np.cross(knee - coxa, ring - knee))                      # femur x tibia: +rotation folds the tibia
    pts = [root, coxa, knee, ring, tip]
    for s in range(4):
        h, t = pts[s], pts[s + 1]; y = nrm(t - h); x = nrm(n - (n @ y) * y)
        par = 'cephalothorax' if s == 0 else f'L_{name}_{s:02d}'
        bone(f'L_{name}_{s + 1:02d}', h, t, par, z=np.cross(x, y), group=f'leg{i}',
             note=['coxa', 'femur', 'tibia', 'tarsus'][s])

if ORPHANS == 'legs':
    om, ot, oroot = sym_pt('orphan', 'mid'), sym_pt('orphan', 'tip'), sym_pt('orphan', 'root')
    n = nrm(np.cross(om - oroot, ot - om))
    for s, (h, t, par) in enumerate(((oroot, om, 'abdomen_01'), (om, ot, 'L_Leg5_03'))):
        y = nrm(t - h); x = nrm(n - (n @ y) * y)
        bone(f'L_Leg5_{s + 3:02d}', h, t, par, z=np.cross(x, y), group='leg5', note=['orphan upper bar', 'orphan tip'][s])

# sockets (no weights)
eyes = (v(LM['sym']['eye_in']) + mir(v(LM['sym']['eye_in']))) / 2
mouth = (v(fl[0]) + v(fl[1])) / 2; mouth[0] = 0.0
bone('ground', [0, 0, 0], [0, 0, 0.15], 'root', deform=False, z=[0, -1, 0], group='socket')
bone('hit_origin', [0, ptip[1] + 0.05, mouth[2]], [0, ptip[1] - 0.10, mouth[2]], 'cephalothorax', deform=False, group='socket',
     note='front of the fangs / palp claws, pointing forward')
bone('fx_head', [0, eyes[1], eyes[2] + 0.03], [0, eyes[1], eyes[2] + 0.15], 'cephalothorax', deform=False, z=[0, -1, 0], group='socket')
bone('fx_abdomen', ab_c, ab_c + [0, 0, 0.15], 'abdomen_01', deform=False, z=[0, -1, 0], group='socket')
bone('fx_spinneret', spin, spin + 0.15 * nrm(spin - ab_c), 'abdomen_02', deform=False, group='socket',
     note='silk shot origin, pointing out of the spinneret')

# mirror every L_ bone to R_
out = []
for b in B:
    out.append(b)
for b in list(B):
    if b['name'].startswith('L_'):
        r = dict(b); r['name'] = 'R_' + b['name'][2:]
        r['head'] = mir(b['head']).round(4).tolist(); r['tail'] = mir(b['tail']).round(4).tolist()
        r['z'] = mir(b['z']).round(5).tolist()
        r['parent'] = ('R_' + b['parent'][2:]) if b['parent'] and b['parent'].startswith('L_') else b['parent']
        out.append(r)
names = [b['name'] for b in out]
assert len(names) == len(set(names))
spec = dict(asset='W07_shroud_spinner', frame='Blender Z up, faces -Y, left = +X, metres', orphans=ORPHANS,
            bones=out, n_bones=len(out), n_deform=sum(b['deform'] for b in out))
with open(os.path.join(WORK, 'rig_spec.json'), 'w') as f:
    json.dump(spec, f, indent=1)
print('bones', spec['n_bones'], 'deform', spec['n_deform'], 'orphans', ORPHANS)
for b in out:
    if not b['name'].startswith('R_'):
        print(f"  {b['name']:14s} <- {str(b['parent']):14s} {b['head']} -> {b['tail']}  L {b['length']}  {b['note']}")
