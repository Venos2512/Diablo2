import sys
sys.path.insert(0, r"E:\Diablo2\ashlar\3d\act-01\monsters\D01_hodling\rig\anim\tools")
import numpy as np
from kk_source import Lib

L = Lib()
fps = 30.0
np.set_printoptions(linewidth=200, precision=3, suppress=True)


def samp(name, step=1 / 30.0):
    t0, t1 = L.clip_range(name)
    ts = np.arange(0, t1 + 1e-9, step)
    T, Q = L.sample_local(name, ts)
    R, P = L.world(T, Q)
    return ts, R, P


for name in ["Unarmed_Melee_Attack_Punch_A", "1H_Melee_Attack_Chop", "Hit_A"]:
    ts, R, P = samp(name)
    print("==", name)
    for hb in ["hand.r", "hand.l"]:
        h = P[L.idx(hb)]
        sp = np.r_[0, np.linalg.norm(np.diff(h, axis=0), axis=1) * 30]
        print(hb, "y:", np.round(h[:, 1], 2))
        print(hb, "speed:", np.round(sp, 1))
    h = P[L.idx("hips")]
    print("hips y", np.round(h[:, 1], 2))
    print("hips z", np.round(h[:, 2], 2))

for name in ["Walking_A", "Running_A"]:
    ts, R, P = samp(name)
    print("==", name, "feet y/z")
    for fb in ["foot.l", "foot.r"]:
        f = P[L.idx(fb)]
        print(fb, "y", np.round(f[:, 1], 2))
        print(fb, "z", np.round(f[:, 2], 3))
    t = P[L.idx("toes.l")]
    print("toes.l z", np.round(t[:, 2], 3))
    print("hips z", np.round(P[L.idx("hips")][:, 2], 3))
    # loop seam
    print("seam |Pfirst-Plast| max", np.abs(P[:, 0] - P[:, -1]).max(), "rot", np.abs(R[:, 0] - R[:, -1]).max())

for name in ["Unarmed_Idle"]:
    ts, R, P = samp(name)
    print("== idle seam pos", np.abs(P[:, 0] - P[:, -1]).max(), "rot", np.abs(R[:, 0] - R[:, -1]).max())
