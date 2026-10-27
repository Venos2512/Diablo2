"""Creature-class config of U04 Charnel Ghoul (family Qh), for the skill's scripts/creature_core.py.

Worked example of the class (G2 2026-10-27). The production rig of U04 was built by rig/scripts/u04_*.py; this config
reproduces it through the skill (same joints, weights rules, control rig, poses, springs):
    blender -b --factory-startup -P <skill>/scripts/creature_run.py -- rig/creature_config.py build --out <dir>
Joint table, smock regions and the body seed rules stay in rig/scripts/u04_joints.py and u04_skin.py (imported here).
Units: J in Tripo units (the GLB as is), left side; SCALE = metres per unit.
"""
import os, sys, collections
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, 'scripts'))
import u04_joints as UJ                      # noqa: E402
import creature_core as cc                   # noqa: E402

AID = 'U04_charnel_ghoul'
FAMILY = 'Qh'
GLB = os.path.join(os.path.dirname(HERE), AID + '.glb')
GLB_SHA256 = '49f607df0428a806e5bff22fb9c30cbf2b50395911939b184b4e228397fc5c4f'
SCALE = UJ.SCALE_OPTIONS['A']['s']           # G1: head top 0.65H = 1.17 m
CATALOG_HEIGHT = 0.65 * 1.8
J = dict(UJ.J)
ROLES = {0: 'body', 1: 'smock', 2: 'hood', 3: 'tie'}
ROLE_DEFAULT = 'tooth'
GARMENTS = {'Smock': ['smock_', 'L_smock_', 'R_smock_'], 'Tie': ['tie_']}
CONTROL_EXTRA = 'Jaw'
INSIDE_ROLES = ['smock']
CLOTH_ROLES = ['smock', 'hood', 'tie']
HIND_MASK = dict(x=0.035, y=0.16, z=0.2)
POSE_CLOSEUP = dict(prefixes=('jaw', 'head'), center=(0, -0.36, 0.82), size=0.55)
SCENE_PROPS = {'u04_scale': SCALE, 'u04_source_sha256': GLB_SHA256, 'u04_rig_status': 'creature_core build'}

# extra bones (U04): mouth socket + jaw after fx_head; third hind segment (2026-10-27); neck tie
EXTRA_BONES = [
    dict(name='fx_mouth', parent='head', head='mouth', tail={'key': 'mouth', 'add': [0, -0.06, 0]}, deform=False, kind='socket', after='fx_head'),
    dict(name='jaw', parent='head', head='jaw', tail='jaw_end', kind='extra', after='fx_mouth'),
    dict(name='{P}_Calf_02', parent='{P}_Calf', head='hock', tail='ankle', connect=True, kind='extra', after='{P}_Calf'),
    dict(name='tie_01', parent='neck', head='tie', tail='tie_mid', kind='extra'),
    dict(name='tie_02', parent='tie_01', head='tie_mid', tail='tie_end', connect=True, kind='extra'),
]
BONE_OVERRIDES = {'{P}_Calf': dict(tail='hock'), '{P}_Foot': dict(parent='{P}_Calf_02')}
CONTROL = {'leg': dict(meta='{P}_Calf_02', joints={'knee': 'knee', 'hock': 'hock', 'ankle': 'ankle', 'ball': 'ball', 'tip': 'toe_end'},
                       pole_side='front', limits=[-25, 130])}
JAW_LIMIT = dict(bone='jaw', x=(-85, 25), yz=8)


# ---------------------------------------------------------------- hooks
def cloth_chains(c):
    """Smock: 6 two-bone chains; roots from R1, tips = mean of the lowest 15 % of each region's hanging vertices."""
    from mathutils import Vector
    from mathutils.bvhtree import BVHTree
    S, T, P = c.S, c.T, c.P
    bvh = BVHTree.FromPolygons([Vector(p) for p in P], [tuple(t) for t in c.body_tris])
    sm_idx = np.nonzero(c.role == 'smock')[0]
    sm_d = np.array([bvh.find_nearest(Vector(P[i]))[3] for i in sm_idx]) / S
    sm_reg = [UJ.smock_region(T[i, 0], T[i, 1], T[i, 2], d) for i, d in zip(sm_idx, sm_d)]
    chains = {}; info = {}
    for name, (parent, why) in UJ.SMOCK_CHAINS.items():
        sel = [k for k, r_ in enumerate(sm_reg) if r_ == name and sm_d[k] > 0.03]
        vs = T[sm_idx[sel]]
        if name.startswith('L_'):
            vs = vs[vs[:, 0] > 0]
        zt, zb = vs[:, 2].max(), vs[:, 2].min()
        bot = vs[vs[:, 2] < zb + 0.15 * (zt - zb)].mean(0)
        top = np.array(UJ.SMOCK_ROOTS[name])
        if not name.startswith('L_'):
            bot[0] = 0.0
        pts = [Vector(top * S), Vector((top + bot) / 2 * S), Vector(bot * S)]
        chains[name] = (parent, pts); info[name] = dict(parent=parent, root=cc.r(pts[0]), tip=cc.r(pts[2]), hanging=len(vs))
        if name.startswith('L_'):
            rn = 'R_' + name[2:]
            chains[rn] = (parent.replace('L_', 'R_'), [cc.mir(q) for q in pts]); info[rn] = dict(parent=parent.replace('L_', 'R_'), mirror_of=name)
    c.extra['smock'] = (sm_idx, sm_reg)
    return chains, info


def body_seeds(c):
    import u04_skin
    return u04_skin.body_seeds(c.T, c.body, c.ix, J)


def cloth_weights(c):
    """Hood: skin without the jaw, smoothed. Tie: ring + knot one block, ends -> tie_01..02. Smock: skin on the back
    (limbs kept 25 % on upper arm / thigh / calf, neck 30 %), panels -> chains. Teeth rigid (upper head, lower jaw)."""
    ix, NB, P, E = c.ix, c.NB, c.P, c.E
    hood = np.nonzero(c.role == 'hood')[0]
    c.Wall[hood] = cc.cloth_follow(c, hood, drop=('jaw',), fallback='head')[0]
    c.Wall = cc.smooth_rows(c.Wall, E, c.role == 'hood', P, iters=4)
    tie = np.nonzero(c.role == 'tie')[0]
    rows, _ = cc.cloth_follow(c, tie, drop=('jaw', 'head'), fallback='neck')
    _, u, _ = cc.seg(P[tie], np.array(c.Jm['tie']), np.array(c.Jm['tie_end']))
    rows[:] = rows[u <= 0.05].mean(0)
    h = cc.sstep(0.0, 0.25, u)[:, None]
    c.Wall[tie] = (1 - h) * rows + h * cc.chain_rows(u, ['tie_01', 'tie_02'], ix, NB)
    sm_idx, sm_reg = c.extra['smock']
    rows, _ = cc.cloth_follow(c, sm_idx, drop=('jaw', 'head'), fallback='chest')
    keep = {'neck': 0.3, 'neck_02': 0.0}
    for P_ in 'LR':
        keep.update({f'{P_}_UpperArm': 0.25, f'{P_}_UpperArm_twist': 0.25, f'{P_}_Thigh': 0.25, f'{P_}_Calf': 0.25})
        for b_ in ('ForeArm', 'ForeArm_twist', 'Hand', 'Finger', 'Calf_02', 'Foot', 'Toe'):
            keep[f'{P_}_{b_}'] = 0.0
    for n_, f_ in keep.items():
        rows[:, ix[n_]] *= f_
    s_ = rows.sum(1); rows[s_ < 1e-6, ix['chest']] = 1.0; rows /= rows.sum(1, keepdims=True)
    cnames = list(c.chains.keys())
    M = np.zeros((c.nw, len(cnames) + 1))
    for k, i in enumerate(sm_idx):
        r_ = sm_reg[k]; M[i, cnames.index(r_) if r_ in cnames else len(cnames)] = 1.0
    M = cc.smooth_rows(M, E, c.role == 'smock', P, iters=12, alpha=0.5)
    Ms = M[sm_idx]; Ms /= Ms.sum(1, keepdims=True)
    Wsm = Ms[:, -1:] * rows
    for k, cn in enumerate(cnames):
        root, tip = np.array(c.chains[cn][1][0]), np.array(c.chains[cn][1][2])
        _, u, _ = cc.seg(P[sm_idx], root, tip)
        h = cc.sstep(0.0, 0.35, u)[:, None]
        Wsm += Ms[:, k:k + 1] * ((1 - h) * rows + h * cc.chain_rows(u, [cn + '_01', cn + '_02'], ix, NB))
    c.Wall[sm_idx] = Wsm
    teeth = {}
    for k in sorted(set(c.isl_w[c.role == 'tooth'].tolist())):
        m = c.isl_w == k; up = c.T[m, 2].mean() > 0.80
        c.Wall[m] = 0.0; c.Wall[m, ix['head' if up else 'jaw']] = 1.0; teeth[int(k)] = 'head' if up else 'jaw'
    c.extra['report'] = dict(teeth=teeth)


def teeth_gap(q, co):
    from mathutils.kdtree import KDTree
    up = [i for i in range(q.NV) if q.role[i] == 'tooth' and q.REST[i, 2] / q.S > 0.80]
    lo_isl = {q.lab_v[i] for i in range(q.NV) if q.role[i] == 'tooth' and q.REST[i, 2] / q.S <= 0.80}
    jawv = [i for i in range(q.NV) if q.role[i] == 'tooth' and q.lab_v[i] in lo_isl]
    kd = KDTree(len(jawv))
    for k, i in enumerate(jawv):
        kd.insert(co[i], k)
    kd.balance()
    return min(kd.find(co[i])[2] for i in up)


# ---------------------------------------------------------------- QA poses (same as rig/scripts/u04_qa.py)
IKOFF = {'ik_arm_L': 0.0, 'ik_arm_R': 0.0, 'ik_leg_L': 0.0, 'ik_leg_R': 0.0}
sym = cc.sym
POSES = {
    'rest': dict(),
    'gallop_reach': dict(props=IKOFF, rot=sym({'ctl_spine_01': [-6, 0, 0], 'ctl_spine_02': [-6, 0, 0], 'ctl_chest': [-6, 0, 0],
                                               'ctl_neck': [8, 0, 0], 'ctl_L_Clavicle': [0, 0, -15], 'ctl_L_UpperArm': [-45, 0, 0], 'ctl_L_ForeArm': [6, 0, 0],
                                               'ctl_L_Hand': [-20, 0, 0], 'ctl_L_Thigh': [35, 0, 0], 'ctl_L_Calf_02': [18, 0, 0],
                                               'ctl_L_Foot': [25, 0, 0]})),
    'gallop_gather': dict(props=IKOFF, rot=sym({'ctl_spine_01': [10, 0, 0], 'ctl_spine_02': [10, 0, 0], 'ctl_chest': [8, 0, 0],
                                                'ctl_neck': [-10, 0, 0], 'ctl_L_UpperArm': [40, 0, 0], 'ctl_L_ForeArm': [-55, 0, 0],
                                                'ctl_L_Hand': [-30, 0, 0], 'ctl_L_Thigh': [-45, 0, 0], 'ctl_L_Calf_02': [-55, 0, 0],
                                                'ctl_L_Foot': [-20, 0, 0]})),
    'pounce': dict(props=IKOFF, loc={'ctl_cog': [0, -0.10, 0.12]},
                   rot=sym({'ctl_cog': [-18, 0, 0], 'ctl_neck': [-12, 0, 0], 'ctl_neck_02': [-10, 0, 0], 'ctl_head': [-8, 0, 0],
                            'ctl_jaw': [15, 0, 0], 'ctl_L_Clavicle': [12, 0, -18], 'ctl_L_UpperArm': [-85, 0, 0], 'ctl_L_ForeArm': [-25, 0, 0],
                            'ctl_L_Hand': [-35, 0, 0], 'ctl_L_Finger': [-20, 0, 0], 'ctl_L_Thigh': [45, 0, 0], 'ctl_L_Calf_02': [20, 0, 0],
                            'ctl_L_Foot': [35, 0, 0]})),
    'head_up': dict(rot={'ctl_neck': [-25, 0, 0], 'ctl_neck_02': [-20, 0, 0], 'ctl_head': [-15, 0, 0]}),
    'head_down': dict(rot={'ctl_neck': [20, 0, 0], 'ctl_neck_02': [18, 0, 0], 'ctl_head': [15, 0, 0]}),
    'head_turn': dict(rot={'ctl_neck': [0, 0, 22], 'ctl_neck_02': [0, 0, 20], 'ctl_head': [0, 15, 0]}),
    'jaw_open': dict(rot={'ctl_jaw': [20, 0, 0]}),
    'jaw_close_50': dict(rot={'ctl_jaw': [-50, 0, 0]}),
    'jaw_close_70': dict(rot={'ctl_jaw': [-70, 0, 0]}),
    'jaw_close_max': dict(rot={'ctl_jaw': [-85, 0, 0]}),
    'twist': dict(rot={'ctl_spine_01': [0, 10, 0], 'ctl_spine_02': [0, 10, 0], 'ctl_chest': [0, 10, 0]}),
    'side_bend': dict(rot={'ctl_spine_01': [0, 0, 10], 'ctl_spine_02': [0, 0, 10], 'ctl_chest': [0, 0, 10], 'ctl_neck': [0, 0, 10]}),
    'arm_forward': dict(props=IKOFF, rot=sym({'ctl_L_UpperArm': [-85, 0, 0]})),
    'arm_back': dict(props=IKOFF, rot=sym({'ctl_L_UpperArm': [55, 0, 0], 'ctl_L_ForeArm': [-30, 0, 0]})),
    'arm_out': dict(props=IKOFF, rot={'ctl_L_UpperArm': [0, 0, 45], 'ctl_R_UpperArm': [0, 0, -45]}),
    'elbow_flex': dict(props=IKOFF, rot=sym({'ctl_L_UpperArm': [-30, 0, 0], 'ctl_L_ForeArm': [-110, 0, 0]})),
    'leg_forward': dict(props=IKOFF, rot=sym({'ctl_L_Thigh': [-60, 0, 0], 'ctl_L_Calf_02': [-70, 0, 0]})),
    'leg_back': dict(props=IKOFF, rot=sym({'ctl_L_Thigh': [45, 0, 0], 'ctl_L_Calf_02': [20, 0, 0], 'ctl_L_Foot': [30, 0, 0]})),
    'shrug': dict(rot=sym({'ctl_L_Clavicle': [25, 0, 0]})),
    'wrist_twist': dict(props=IKOFF, rot=sym({'ctl_L_Hand': [0, 60, 0]})),
    'hand_roll': dict(rot=sym({'ctl_L_Palm_roll': [40, 0, 0]})),
    'heel_lift': dict(rot=sym({'ctl_L_Ball_roll': [40, 0, 0]})),
    'knee_flex': dict(props=IKOFF, rot=sym({'ctl_L_Thigh': [-30, 0, 0], 'ctl_L_Calf': [70, 0, 0]})),
    'hock_flex': dict(props=IKOFF, rot=sym({'ctl_L_Calf_02': [-50, 0, 0], 'ctl_L_Foot': [30, 0, 0]})),
    'hock_roll': dict(rot=sym({'ctl_L_Hock_roll': [20, 0, 0]})),
    'crouch': dict(loc={'ctl_cog': [0, 0, -0.12]}),
    'cloth_swing': dict(rot={'ctl_smock_front_01': [-25, 0, 0], 'ctl_smock_back_01': [25, 0, 0], 'ctl_L_smock_flank_01': [0, 0, 20],
                             'ctl_R_smock_flank_01': [0, 0, -20], 'ctl_tie_01': [-30, 0, 0]}),
}
EDITOR_MIXES = [('gallop_cycle', 'gallop_reach', 'gallop_gather', 20)]

QA_REGIONS = {
    'headjaw': (['head', 'jaw', 'neck_02', 'neck', 'chest'], (0, -0.36, 0.80), 0.42, 'left'),
    'shoulder': (['chest', 'L_Clavicle', 'L_UpperArm', 'L_UpperArm_twist', 'spine_02', 'L_ForeArm'], (0.17, -0.14, 0.60), 0.40, 'left'),
    'torso': (['pelvis', 'spine_01', 'spine_02', 'chest', 'L_Thigh', 'L_Clavicle'], (0.0, 0.05, 0.62), 0.62, 'left'),
    'leg': (['L_Thigh', 'L_Calf', 'L_Calf_02', 'L_Foot', 'L_Toe', 'pelvis'], (0.17, 0.33, 0.33), 0.70, 'left'),
    'hand': (['L_ForeArm', 'L_ForeArm_twist', 'L_Hand', 'L_Finger'], (0.26, -0.22, 0.08), 0.28, 'topdown'),
    'smock': (['smock_front_01', 'smock_front_02', 'L_smock_shoulder_01', 'L_smock_shoulder_02', 'L_smock_flank_01',
               'L_smock_flank_02', 'smock_back_01', 'smock_back_02'], (0.0, 0.05, 0.58), 0.75, 'left'),
}

# ---------------------------------------------------------------- springs + cloth layers (rig/scripts/u04_spring.py)
SPRING = dict(
    chains=[dict(root='smock_back_01', stiffness=1.7, layer=0), dict(root='L_smock_flank_01', stiffness=1.6, layer=0),
            dict(root='R_smock_flank_01', stiffness=1.6, layer=0), dict(root='L_smock_shoulder_01', stiffness=1.6, layer=0),
            dict(root='R_smock_shoulder_01', stiffness=1.6, layer=0), dict(root='smock_front_01', stiffness=1.5, layer=0),
            dict(root='tie_01', stiffness=0.8, drag=0.3, gravity=0.8, hitRadius=0.02, wind=0.3, layer=1)],
    colliders=[('pelvis', 'sphere', None), ('spine_01', 'capsule', 'spine_02'), ('spine_02', 'capsule', 'chest'),
               ('chest', 'capsule', 'neck'), ('neck', 'capsule', 'neck_02')] +
              [(f'{P}_{b}', 'capsule', f'{P}_{t}') for P in 'LR' for b, t in (('UpperArm', 'ForeArm'), ('ForeArm', 'Hand'),
                                                                               ('Thigh', 'Calf'), ('Calf', 'Calf_02'))],
    link_candidates=[('smock_back_01', 'L_smock_flank_01'), ('smock_back_01', 'R_smock_flank_01'),
                     ('L_smock_flank_01', 'L_smock_shoulder_01'), ('R_smock_flank_01', 'R_smock_shoulder_01'),
                     ('smock_front_01', 'L_smock_shoulder_01'), ('smock_front_01', 'R_smock_shoulder_01')],
)
