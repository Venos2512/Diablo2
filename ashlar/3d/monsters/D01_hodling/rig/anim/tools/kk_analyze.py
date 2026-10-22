import sys
sys.path.insert(0, r"E:\Diablo2\ashlar\3d\monsters\D01_hodling\rig\anim\tools")
import numpy as np
from kk_source import Lib

L = Lib()
T0 = np.stack(L.rest_t)[:, None, :]
Q0 = np.stack(L.rest_q)[:, None, :]
R0, P0 = L.world(T0, Q0)
for nm in ["hips", "upperleg.l", "foot.l", "toes.l", "head", "upperarm.l", "hand.l", "handslot.l", "chest", "root"]:
    print("rest", nm, np.round(P0[L.idx(nm), 0], 3))
print("T-Pose range", L.clip_range("T-Pose"))
fps = 30.0
for name in ["Unarmed_Idle", "Walking_A", "Running_A", "Unarmed_Melee_Attack_Punch_A", "Hit_A", "Death_A"]:
    t0, t1 = L.clip_range(name)
    n = int(round(t1 * fps)) + 1
    ts = np.arange(n) / fps
    T, Q = L.sample_local(name, ts)
    R, P = L.world(T, Q)
    g = lambda nm: P[L.idx(nm)]
    print("==", name, n, "t1", t1)
    h = g("hips"); fl = g("foot.l"); fr = g("foot.r"); tl = g("toes.l"); hl = g("hand.l"); hr = g("hand.r")
    r = lambda a: np.round(a, 3)
    print(" hips x", r(h[:, 0].min()), r(h[:, 0].max()), "y(-fwd)", r(h[:, 1].min()), r(h[:, 1].max()), "z", r(h[:, 2].min()), r(h[:, 2].max()))
    print(" foot.l y", r(fl[:, 1].min()), r(fl[:, 1].max()), "z", r(fl[:, 2].min()), r(fl[:, 2].max()))
    print(" toes.l z", r(tl[:, 2].min()), r(tl[:, 2].max()))
    print(" hand.l y", r(hl[:, 1].min()), r(hl[:, 1].max()), "hand.r y", r(hr[:, 1].min()), r(hr[:, 1].max()))
