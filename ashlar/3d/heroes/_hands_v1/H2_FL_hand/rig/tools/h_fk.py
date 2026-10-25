"""H2_FL_hand rig: forward kinematics of the runtime skeleton in numpy, with the same pose spec as h09_rom.py, so weight variants and
pose angles can be swept without Blender. Parity with Blender's evaluation is checked by h_fk.py itself (python -I -B h_fk.py <rig_dir>):
bone matrices against rig/_work/poses_A.npz 'M' and LBS positions against its 'P' (after the weights of A).

Semantics (= Blender, armature at identity): pose = parent_pose @ (parent_rest^-1 @ rest) @ basis; basis of a ctl bone = quaternion
(curl / spread / bones / lab), then the fist constraint (local X rotation, mix AFTER: basis @ Rx); forearm_twist basis = Ry(-(1-f) t)
with t = the twist (swing-twist about local Y) of the forearm basis.
"""
import json
import math
import os
import sys

import numpy as np

DEG = math.pi / 180
FING = ['thumb', 'index', 'middle', 'ring', 'pinky']


def qmul(a, b):
    w1, x1, y1, z1 = a
    w2, x2, y2, z2 = b
    return np.array([w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2, w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2,
                     w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2, w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2])


def qaxis(axis, ang):
    a = np.asarray(axis, float)
    a = a / np.linalg.norm(a)
    return np.array([math.cos(ang / 2), *(a * math.sin(ang / 2))])


def qmat(q):
    w, x, y, z = q / np.linalg.norm(q)
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                     [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                     [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])


class FK:
    def __init__(self, rig):
        self.rig = rig
        sk = json.load(open(os.path.join(rig, '_work', 'skeleton.json')))
        self.R = json.load(open(os.path.join(rig, 'rig_recipe.json')))
        self.order = sk['order']
        self.bones = sk['bones']
        self.rest = {n: np.array(b['matrix_local']) for n, b in self.bones.items()}
        la = json.load(open(os.path.join(rig, '_work', 'lab_axes.json')))
        self.lab = la['lab_axes_hand_frame_blender']
        self.spread_sign = la['spread_sign']

    def local_axis(self, n, v):
        return np.linalg.inv(self.rest[n][:3, :3]) @ np.asarray(v, float)

    def basis(self, spec):
        q = {n: np.array([1.0, 0, 0, 0]) for n in self.order}
        R = self.R
        if 'lab' in spec:
            offer, grip = spec['lab']
            LP = R['rom']['lab_finger_poses']
            lerp = lambda a, b, t: a + (b - a) * t  # noqa: E731
            for f in FING:
                p = LP[f]
                curl = [lerp(lerp(p['relaxed'][k], p['open'][k], offer), p['grip'][k], grip) for k in range(3)]
                spread = lerp(lerp(p['spread']['relaxed'], p['spread']['open'], offer), p['spread']['grip'], grip)
                for k in range(3):
                    n = f'{f}_0{k + 1}'
                    ax = self.lab[n]
                    qq = np.array([1.0, 0, 0, 0])
                    if k == 0:
                        qq = qmul(qq, qaxis(self.local_axis(n, ax['spread']), spread * DEG))
                    qq = qmul(qq, qaxis(self.local_axis(n, ax['curl']), curl[k] * DEG))
                    q[n] = qq
        if 'lab_curl' in spec:  # explicit lab-axis angles (same derivation as 'lab'): {finger: [c1, c2, c3]}, 'lab_spread': {finger: deg}
            for f, cl in spec['lab_curl'].items():
                for k in range(3):
                    n = f'{f}_0{k + 1}'
                    ax = self.lab[n]
                    qq = np.array([1.0, 0, 0, 0])
                    if k == 0:
                        qq = qmul(qq, qaxis(self.local_axis(n, ax['spread']), spec.get('lab_spread', {}).get(f, 0.0) * DEG))
                    qq = qmul(qq, qaxis(self.local_axis(n, ax['curl']), cl[k] * DEG))
                    q[n] = qq
        for f, c in spec.get('curl', {}).items():
            for k in range(3):
                n = f'{f}_0{k + 1}'
                q[n] = qmul(q[n], qaxis([1, 0, 0], c[k] * DEG))
        for f, a in spec.get('spread', {}).items():
            n = f'{f}_01'
            q[n] = qmul(qaxis([0, 0, 1], self.spread_sign[f] * a * DEG), q[n])
        for n, e in spec.get('bones', {}).items():
            q[n] = qmul(qmul(qmul(q[n], qaxis([1, 0, 0], e[0] * DEG)), qaxis([0, 1, 0], e[1] * DEG)), qaxis([0, 0, 1], e[2] * DEG))
        if 'fist' in spec:
            for n, deg in R['skeleton']['fist_deg'].items():
                qf = qaxis([1, 0, 0], spec['fist'] * deg[0] * DEG)
                if len(deg) > 1:  # the Transformation constraint builds an XYZ euler: matrix Rz @ Rx
                    qf = qmul(qaxis([0, 0, 1], spec['fist'] * deg[1] * DEG), qf)
                q[n] = qmul(q[n], qf)
        # twist helper: swing-twist Y of the forearm basis
        w, x, y, z = q['forearm']
        tw = 2 * math.atan2(y, w)
        q['forearm_twist'] = qaxis([0, 1, 0], -(1 - R['skeleton']['twist_factor']) * tw)
        return q

    def pose(self, spec):
        q = self.basis(spec)
        M = {}
        for n in self.order:
            b = self.bones[n]
            B = np.eye(4)
            B[:3, :3] = qmat(q[n])
            if b['parent']:
                p = b['parent']
                M[n] = M[p] @ np.linalg.inv(self.rest[p]) @ self.rest[n] @ B
            else:
                M[n] = self.rest[n] @ B
        return M

    def mats(self, spec, names):
        M = self.pose(spec)
        return np.array([M[n] for n in names])


def lbs(V, W, wbones, M, rest, bnames):
    idx = [bnames.index(n) for n in wbones]
    S = np.einsum('bij,bjk->bik', M[idx], np.linalg.inv(rest[idx]))
    Vh = np.concatenate([V, np.ones((len(V), 1))], 1)
    out = np.zeros_like(V)
    for j in range(len(idx)):
        w = W[:, j]
        m = w > 0
        out[m] += w[m, None] * (Vh[m] @ S[j].T)[:, :3]
    return out


if __name__ == '__main__':
    rig = sys.argv[1]
    tg = sys.argv[2] if len(sys.argv) > 2 else 'A'
    fk = FK(rig)
    z = np.load(os.path.join(rig, '_work', f'poses_{tg}.npz'), allow_pickle=True)
    names = [str(x) for x in z['names']]
    bn = [str(b) for b in z['bones']]
    wz = np.load(os.path.join(rig, '_work', f'weights_{tg}.npz'), allow_pickle=True)
    V = np.load(os.path.join(rig, '_work', 'mesh.npz'), allow_pickle=True)['V']
    worst_m, worst_p = 0.0, 0.0
    for i, nm in enumerate(names):
        M = fk.mats(fk.R['rom']['poses'][nm], bn)
        dm = float(np.abs(M - z['M'][i]).max())
        P = lbs(V, wz['W'], [str(b) for b in wz['bones']], M, z['rest'], bn)
        dp = float(np.linalg.norm(P - z['P'][i], axis=1).max())
        worst_m, worst_p = max(worst_m, dm), max(worst_p, dp)
        if dm > 1e-5 or dp > 1e-5:
            print('MISMATCH', nm, dm, dp)
    print('FK parity: max matrix diff %.2e, max vertex diff %.3e m over %d poses' % (worst_m, worst_p, len(names)))
