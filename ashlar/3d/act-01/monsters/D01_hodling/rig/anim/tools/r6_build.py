"""R6: author the six D01_hodling clips as editable Actions on the approved control rig (D01_control).

Run (never overwrites the G2 source; opens a copy of it and saves a NEW file):
  blender -b <G2 .blend> -P r6_build.py -- --out <anim .blend> [--clips idle,walk,run,attack,hit,death] [--ref]

How the motion is made (retargeting, not a procedural gait):
  * the source is KayKit Adventurers 1.0 (CC0) clips, sampled by kk_source.py from the pinned git blob in ../refs/;
  * spine / chest / neck / head / arms: FK on ctl_* bones. Each target bone receives the *world-space rotation delta* of the
    corresponding KayKit bone relative to the shared T-pose (both rigs are T-pose, +X = character left), composed on the Hodling rest;
  * pelvis position + legs: end-effector retarget. Hip-joint centre and ankles of the source are scaled by the leg-length ratio
    (S_LEG, measured from rest) and given to ctl_cog / ctl_*_Foot_IK (+ heel/ball roll for foot pitch); the Hodling's own IK solves the knees;
  * contact: contact intervals come from the source foot height; sole contact is then verified/corrected on the DEFORMED mesh
    (lowest foot vertex = floor) and stance feet are made constant-velocity (no slip against the treadmill speed);
  * secondary: sack / helmet / ears are damped lag of chest/head rotation, loincloth follows hip flexion (manual-clearance rule).
Time: source -> target is an explicit retime (time-warp table per clip) followed by resampling at 24 fps.
"""
import json
import math
import os
import sys
import time

import numpy as np

import bpy
from mathutils import Matrix, Quaternion, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
ANIM = os.path.dirname(HERE)
RIG = os.path.dirname(ANIM)
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(RIG, "tools"))
import d01_common as C  # noqa: E402
import d01_rigkit as K  # noqa: E402
from kk_source import Lib, q2m, m2q, qmul, qconj, slerp, qnorm  # noqa: E402

FPS = 24
SIDES = ("L", "R")
KK = {"L": "l", "R": "r"}

# ---------------------------------------------------------------------------------------------- clip table
# time maps: list of (out_frame, src_seconds) knots, piecewise linear. N = output intervals (duration = N / 24 s).
IDLE_P = 1.0666667222976685
CLIPS = {
    "idle": dict(src="Idle", N=48, loop=True, cycles=2,
                 timemap=[(0, 0.0), (24, IDLE_P), (24, 0.0), (48, IDLE_P)], state="idle", gain=1.8, feet="planted"),
    "walk": dict(src="Walking_A", N=26, loop=True, timemap=[(0, 0.0), (26, 1.0666667222976685)], state="walk", lift=0.65),
    "run": dict(src="Running_A", N=18, loop=True, timemap=[(0, 0.0), (18, 0.800000011920929)], state="run", lift=0.85, stance_extend=True),
    "attack": dict(src="Unarmed_Melee_Attack_Punch_A", N=18, loop=False,
                   timemap=[(0, 0.10), (8, 0.50), (18, 1.3333)], state="attack", event_hit_frame=8, feet="planted", hip_xy=0.45),
    "hit": dict(src="Hit_A", N=11, loop=False, timemap=[(0, 0.0), (11, 0.6666666865348816)], state="hit", gain=1.8, feet="planted", hip_xy=0.45),
    "death": dict(src="Death_A", N=30, loop=False, timemap=[(0, 0.0), (30, 0.800000011920929)], state="death", feet="free", loin_max=130),
}

# ---------------------------------------------------------------------------------------------- helpers
def rotx(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])


def rotz(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])


def rotvec_to_R(v):
    v = np.asarray(v, float)
    th = np.linalg.norm(v, axis=-1, keepdims=True)
    k = v / np.maximum(th, 1e-12)
    K_ = np.zeros(v.shape[:-1] + (3, 3))
    K_[..., 0, 1] = -k[..., 2]; K_[..., 0, 2] = k[..., 1]
    K_[..., 1, 0] = k[..., 2]; K_[..., 1, 2] = -k[..., 0]
    K_[..., 2, 0] = -k[..., 1]; K_[..., 2, 1] = k[..., 0]
    th = th[..., None]
    I = np.eye(3)
    return I + np.sin(th) * K_ + (1 - np.cos(th)) * (K_ @ K_)


def R_to_rotvec(R):
    q = m2q(R)
    th = 2 * np.arccos(np.clip(q[..., 0], -1, 1))
    s = np.sqrt(np.maximum(1 - q[..., 0] ** 2, 0))
    ax = np.where(s[..., None] > 1e-9, q[..., 1:] / np.maximum(s[..., None], 1e-12), 0)
    th = np.where(th > math.pi, th - 2 * math.pi, th)
    return ax * th[..., None]


def slerp_R(Ra, Rb, t):
    """Rotation matrices (n,3,3): geodesic interpolation Ra -> Rb at fraction t (t may exceed 1 to exaggerate)."""
    rel = np.einsum("nji,njk->nik", Ra, Rb)
    return np.einsum("nij,njk->nik", Ra, rotvec_to_R(R_to_rotvec(rel) * t))


def identity_R(n):
    return np.tile(np.eye(3), (n, 1, 1))


def fscale(D, t):
    """Scale a world rotation delta (n,3,3) by t (t=0: identity)."""
    return rotvec_to_R(R_to_rotvec(D) * t)


def spring_lag(sig, hz, zeta, fps, loop):
    """Second-order damped follower of sig (n,3) sampled at fps. loop: run 3 periods, keep the middle one (seam-safe)."""
    n = len(sig)
    seq = np.concatenate([sig[:-1]] * 3 + [sig[-1:]]) if loop else sig
    w = 2 * math.pi * hz
    dt = 1.0 / fps
    sub = 8
    x = seq[0].copy()
    v = np.zeros(3)
    out = []
    for i in range(len(seq)):
        for _ in range(sub):
            a = w * w * (seq[i] - x) - 2 * zeta * w * v
            v += a * dt / sub
            x += v * dt / sub
        out.append(x.copy())
    out = np.array(out)
    return out[n - 1:2 * (n - 1) + 1] if loop else out


def mat_from_Rt(R, t):
    M = np.eye(4)
    M[:3, :3] = R
    M[:3, 3] = t
    return M


def decomp_basis(M):
    """4x4 basis matrix -> (loc3, quat wxyz)."""
    q = Matrix(M[:3, :3].tolist()).to_quaternion()
    return M[:3, 3].copy(), np.array([q.w, q.x, q.y, q.z])


# ---------------------------------------------------------------------------------------------- rig model
class Rig:
    def __init__(self):
        self.ct = K.control()
        self.mesh = K.get_mesh()
        self.rt = K.runtime()
        assert np.allclose(np.array(self.ct.matrix_world), np.eye(4)), "control armature must have identity object transform"
        self.rest = {}
        self.parent = {}
        for b in self.ct.data.bones:
            self.rest[b.name] = np.array(b.matrix_local)
            self.parent[b.name] = b.parent.name if b.parent else None
        self.pb = self.ct.pose.bones
        # foot vertex sets (deformed geometry sole tests)
        me = self.mesh.data
        names = [g.name for g in self.mesh.vertex_groups]
        n = len(me.vertices)
        W = np.zeros((n, len(names)))
        for v in me.vertices:
            for g in v.groups:
                W[v.index, g.group] = g.weight
        self.W = W
        self.gnames = names
        self.foot_v = {}
        for s in SIDES:
            idx = [names.index(f"{s}_Foot"), names.index(f"{s}_Toe")]
            self.foot_v[s] = np.nonzero(W[:, idx].sum(1) > 0.5)[0]
        self.rest_pos = K.rest_positions()

    def set_basis(self, name, loc, quat):
        pb = self.pb[name]
        pb.rotation_mode = "QUATERNION"
        pb.location = Vector(loc)
        pb.rotation_quaternion = Quaternion(quat)

    def reset(self):
        K.reset_pose(self.ct)


# ---------------------------------------------------------------------------------------------- retarget core
class Retarget:
    def __init__(self, rig, lib):
        self.rig = rig
        self.lib = lib
        T0 = np.stack(lib.rest_t)[:, None, :]
        Q0 = np.stack(lib.rest_q)[:, None, :]
        self.R0, self.P0 = lib.world(T0, Q0)  # (nodes,1,3,3), (nodes,1,3)
        rest = rig.rest
        self.Rr = {k: v[:3, :3] for k, v in rest.items()}
        self.Pr = {k: v[:3, 3] for k, v in rest.items()}
        # scale legs: hip-joint-to-ankle length ratio (measured on both rest poses)
        kk_hip = (self.P0[lib.idx("upperleg.l"), 0] + self.P0[lib.idx("upperleg.r"), 0]) / 2
        kk_ank = (self.P0[lib.idx("foot.l"), 0] + self.P0[lib.idx("foot.r"), 0]) / 2
        hod_hip = (self.Pr["ctl_L_Thigh"] + self.Pr["ctl_R_Thigh"]) / 2
        hod_ank = (self.Pr["ctl_L_Calf"] + self.Pr["ctl_R_Calf"]) / 2  # ctl_*_Foot head == calf tail == ankle; Calf head = knee
        hod_ank = (self.Pr["ctl_L_Foot"] + self.Pr["ctl_R_Foot"]) / 2
        self.S = float(np.linalg.norm(hod_hip[2] - hod_ank[2]) / np.linalg.norm(kk_hip[2] - kk_ank[2]))
        self.kk_hip_rest = kk_hip
        self.hod_hip_rest = hod_hip

    def delta(self, node, R):
        """World-space rotation delta of source node: R(t) @ R_rest^-1  -> (nt,3,3)."""
        return np.einsum("tij,kj->tik", R[self.lib.idx(node)], self.R0[self.lib.idx(node), 0])

    # -------------------------------------------------------------- source evaluation
    def sample(self, spec, nf):
        tm = np.array(spec["timemap"], float)
        f = np.arange(nf + 1, dtype=float)
        # piecewise linear with possible duplicate out-frames (jump knots used for cyclic idle)
        t = np.zeros(len(f))
        for i, fi in enumerate(f):
            seg = None
            for k in range(len(tm) - 1):
                if tm[k, 0] <= fi <= tm[k + 1, 0] and tm[k + 1, 0] > tm[k, 0]:
                    seg = k
                    if fi < tm[k + 1, 0] or k == len(tm) - 2:
                        break
            a, b = tm[seg], tm[seg + 1]
            t[i] = a[1] + (fi - a[0]) / (b[0] - a[0]) * (b[1] - a[1])
        T, Q = self.lib.sample_local(spec["src"], t)
        R, P = self.lib.world(T, Q)
        return t, R, P

    def foot_contact(self, P, side):
        """Contact mask from SOURCE foot/toe heights (knight units)."""
        s = KK[side]
        fz = P[self.lib.idx(f"foot.{s}")][:, 2]
        tz = P[self.lib.idx(f"toes.{s}")][:, 2] if f"toes.{s}" in self.lib.names else fz
        return (fz < 0.160) | (tz < 0.040)

    # -------------------------------------------------------------- the pose solver
    def solve(self, spec, nf, loop, secondary=True, idle_extra=False):
        lib, S = self.lib, self.S
        n = nf + 1
        t_src, R, P = self.sample(spec, nf)
        D = {nm: self.delta(nm, R) for nm in ["hips", "spine", "chest", "head", "upperarm.l", "upperarm.r", "lowerarm.l", "lowerarm.r",
                                                   "hand.l", "hand.r", "foot.l", "foot.r"]}
        g = spec.get("gain", 1.0)  # amplitude of the source motion about its first pose (readability at ~0.5 m)
        if g != 1.0:
            for k_ in D:
                if k_.startswith("foot"):
                    continue
                D0 = D[k_][0]
                D[k_] = np.einsum("nij,jk->nik", fscale(np.einsum("nij,kj->nik", D[k_], D0), g), D0)
        Dw = {}
        Dw["ctl_pelvis"] = D["hips"]
        Dw["ctl_spine_01"] = slerp_R(D["hips"], D["spine"], 0.6)
        Dw["ctl_spine_02"] = D["spine"]
        Dw["ctl_chest"] = D["chest"]
        Dw["ctl_neck"] = slerp_R(D["chest"], D["head"], 0.35)
        head = D["head"]
        if idle_extra:  # modest Hodling character: slow glance across the loop (closes: zero at both ends)
            ph = np.arange(n) / (n - 1)
            yaw = np.radians(5.0) * np.sin(2 * np.pi * ph)
            head = np.einsum("nij,njk->nik", np.stack([rotz(a) for a in yaw]), head)
        Dw["ctl_head"] = head
        for s in SIDES:
            k = KK[s]
            Dw[f"ctl_{s}_UpperArm"] = D[f"upperarm.{k}"]
            Dw[f"ctl_{s}_ForeArm"] = D[f"lowerarm.{k}"]
            Dw[f"ctl_{s}_Hand"] = D[f"hand.{k}"]
        out = {}
        if secondary:
            fps = FPS
            lag_c = R_to_rotvec(D["chest"])
            lag_h = R_to_rotvec(head)
            Lc = rotvec_to_R(spring_lag(lag_c, 3.0, 0.45, fps, loop))
            Lh = rotvec_to_R(spring_lag(lag_h, 4.0, 0.40, fps, loop))
            Dw["ctl_sack"] = slerp_R(D["chest"], Lc, 0.7)
            Dw["ctl_helmet"] = slerp_R(head, Lh, 0.35)
            Dw["ctl_L_ear"] = slerp_R(head, Lh, 1.5)
            Dw["ctl_R_ear"] = slerp_R(head, Lh, 1.5)
        else:
            Dw["ctl_sack"] = D["chest"]; Dw["ctl_helmet"] = head; Dw["ctl_L_ear"] = head; Dw["ctl_R_ear"] = head
        # ---- FK basis (rotation) top-down, bone order = rig hierarchy order
        Rpose = {}
        basis = {}
        order = ["ctl_pelvis", "ctl_spine_01", "ctl_spine_02", "ctl_chest", "ctl_neck", "ctl_head", "ctl_helmet", "ctl_L_ear", "ctl_R_ear",
                 "ctl_sack", "ctl_L_UpperArm", "ctl_L_ForeArm", "ctl_L_Hand", "ctl_R_UpperArm", "ctl_R_ForeArm", "ctl_R_Hand"]
        rr = self.Rr
        cog_R = rr["ctl_cog"]  # cog has no rotation
        for b in order:
            par = self.rig.parent[b]
            Rw = np.einsum("nij,jk->nik", Dw[b], rr[b])
            Rp = Rpose[par] if par in Rpose else np.tile(rr[par], (n, 1, 1))
            rel = np.einsum("nij,jk,kl->nil", Rp, rr[par].T, rr[b])
            Rb = np.einsum("nji,njk->nik", rel, Rw)
            Rpose[b] = Rw
            qs = m2q(Rb)
            basis[b] = (np.zeros((n, 3)), qs)
        # ---- cog: place hip-joint centre at scaled source position
        hj = (P[lib.idx("upperleg.l")] + P[lib.idx("upperleg.r")]) / 2  # (n,3)
        if g != 1.0:
            hj = hj[0:1] + g * (hj - hj[0:1])
        hxy = spec.get("hip_xy", 1.0)  # planted-foot clips: the Hodling's legs are short, so the pelvis travels less than the knight's
        if hxy != 1.0:
            hj = hj.copy()
            hj[:, :2] = hj[0:1, :2] + hxy * (hj[:, :2] - hj[0:1, :2])
        H_t = self.hod_hip_rest[None] + S * (hj - self.kk_hip_rest[None])
        cog_head = self.Pr["ctl_cog"]
        off = (self.hod_hip_rest - cog_head)
        d_total = H_t - cog_head[None] - np.einsum("nij,j->ni", D["hips"], off)
        cog_loc = np.einsum("ji,nj->ni", cog_R, d_total)
        basis["ctl_cog"] = (cog_loc, np.tile([1.0, 0, 0, 0], (n, 1)))
        # ---- legs: ankle targets + foot pitch
        legs = {}
        for s in SIDES:
            k = KK[s]
            fn = lib.idx(f"foot.{k}")
            ank = P[fn]
            ank_rest = self.P0[fn, 0]
            dlt = ank - ank_rest[None]
            lift = spec.get("lift", 1.0)  # swing-foot height gain: the Hodling's thigh is short, a full-height knight swing needs >85 deg of hip flexion
            if lift != 1.0:
                dlt = dlt.copy()
                dlt[:, 2] = np.where(dlt[:, 2] > 0, dlt[:, 2] * lift, dlt[:, 2])
            A_pos = self.Pr[f"ctl_{s}_Foot"][None] + S * dlt
            Df = D[f"foot.{k}"]
            fwd = np.einsum("nij,j->ni", Df, np.array([0, -1.0, 0]))
            pitch = -np.arcsin(np.clip(fwd[:, 2], -1, 1))  # >0 heel up (rotation about +X)
            yaw = np.arctan2(fwd[:, 0], -fwd[:, 1])
            contact = self.foot_contact(P, s)
            legs[s] = dict(A_pos=A_pos, pitch=pitch, yaw=yaw, contact=contact)
        meta = dict(t_src=t_src, S=S)
        return dict(basis=basis, legs=legs, meta=meta, Dw=Dw, Rpose=Rpose, D=D, P=P, R=R)

    # -------------------------------------------------------------- foot IK basis from targets
    def foot_pose(self, s, A_pos, pitch, yaw):
        """Foot_IK world pose (rotation (n,3,3), translation (n,3)) that puts the ankle at A_pos with foot pitch (>0 heel up, pivot at the
        ball; <0 toe up, pivot at the heel) done by Ball_roll / Heel_roll, and yaw about +Z done by Foot_IK itself."""
        rest = self.rig.rest
        rF, rA = rest[f"ctl_{s}_Foot_IK"], rest[f"ctl_{s}_Ankle_target"]
        rB, rH = rest[f"ctl_{s}_Ball_roll"], rest[f"ctl_{s}_Heel_roll"]
        n = len(A_pos)
        FR = np.zeros((n, 3, 3))
        FP = np.zeros((n, 3))
        rAi = np.linalg.inv(rA)
        for i in range(n):
            RB = self._pivot_rot(rB[:3, 3], max(pitch[i], 0.0))
            RH = self._pivot_rot(rH[:3, 3], min(pitch[i], 0.0))
            Roll = RH @ RB
            Ades = np.eye(4)
            Ades[:3, :3] = rotz(yaw[i]) @ Roll[:3, :3] @ rA[:3, :3]
            Ades[:3, 3] = A_pos[i]
            # A = Pf rF^-1 Roll rA  =>  Pf = A_des rA^-1 Roll^-1 rF
            Pf = Ades @ rAi @ np.linalg.inv(Roll) @ rF
            FR[i], FP[i] = Pf[:3, :3], Pf[:3, 3]
        return FR, FP

    def foot_basis_from(self, s, FR, FP, pitch, idx=None):
        """Basis arrays for Foot_IK (from its world pose), Heel_roll and Ball_roll. idx: only these frames (others identity)."""
        rest = self.rig.rest
        rF, rH, rB = rest[f"ctl_{s}_Foot_IK"], rest[f"ctl_{s}_Heel_roll"], rest[f"ctl_{s}_Ball_roll"]
        n = len(FP)
        out = {nm: (np.zeros((n, 3)), np.tile([1.0, 0, 0, 0], (n, 1))) for nm in
               (f"ctl_{s}_Foot_IK", f"ctl_{s}_Heel_roll", f"ctl_{s}_Ball_roll")}
        rFi, rHi, rBi = (np.linalg.inv(m) for m in (rF, rH, rB))
        for i in (range(n) if idx is None else idx):
            RB = self._pivot_rot(rB[:3, 3], max(pitch[i], 0.0))
            RH = self._pivot_rot(rH[:3, 3], min(pitch[i], 0.0))
            bF = rFi @ mat_from_Rt(FR[i], FP[i])
            out[f"ctl_{s}_Foot_IK"][0][i], out[f"ctl_{s}_Foot_IK"][1][i] = decomp_basis(bF)
            out[f"ctl_{s}_Heel_roll"][0][i], out[f"ctl_{s}_Heel_roll"][1][i] = decomp_basis(rHi @ RH @ rH)
            out[f"ctl_{s}_Ball_roll"][0][i], out[f"ctl_{s}_Ball_roll"][1][i] = decomp_basis(rBi @ RB @ rB)
        return out

    def contact_pivot(self, s, FP, pitch, yaw, contact):
        """Stance frames: make the sole's ground-contact point (ball when the heel is up, heel when the toe is up) follow the treadmill line.
        Ball_roll / Heel_roll pivot about their bone heads (the ball joint sits 12 mm above the floor), so a pure roll would scrape the
        contact point along the floor; Foot_IK's translation is corrected so the contact point's image stays on the line (FP holds the
        constant-velocity Foot_IK origin path on entry)."""
        rest = self.rig.rest
        rF, rB = rest[f"ctl_{s}_Foot_IK"], rest[f"ctl_{s}_Ball_roll"]
        h0 = rF[:3, 3].copy()
        b0 = np.array([rB[0, 3], rB[1, 3], h0[2]])
        out = FP.copy()
        for k in range(len(FP)):
            if not contact[k]:
                continue
            RB = self._pivot_rot(rB[:3, 3], max(pitch[k], 0.0))
            RH = self._pivot_rot(rest[f"ctl_{s}_Heel_roll"][:3, 3], min(pitch[k], 0.0))
            Roll = RH @ RB
            Rz = rotz(yaw[k])
            c0 = b0 if pitch[k] > 0 else h0
            d = FP[k] - h0                      # displacement of the flat foot along the stance line (z = 0 inside stance)
            c_img = Rz @ (c0 - h0) + h0 + d     # where the contact point must be
            t = c_img - Rz @ (Roll @ np.append(c0, 1.0))[:3]
            out[k] = Rz @ h0 + t
        return out

    @staticmethod
    def _pivot_rot(p, a):
        M = np.eye(4)
        M[:3, :3] = rotx(a)
        M[:3, 3] = p - rotx(a) @ p
        return M


def contact_runs(mask, loop):
    """Contiguous True runs (lists of frame indices). loop: runs may wrap around the seam (last frame duplicates frame 0)."""
    m = np.asarray(mask[:-1] if loop else mask, bool)
    L = len(m)
    if not m.any():
        return []
    if m.all():
        return [list(range(L))]
    start = int(np.argmin(m)) if loop else 0
    idx = [(start + i) % L for i in range(L)] if loop else list(range(L))
    runs, cur = [], []
    for i in idx:
        if m[i]:
            cur.append(i)
        elif cur:
            runs.append(cur)
            cur = []
    if cur:
        runs.append(cur)
    return runs


def stance_lock(FP, contact, loop, floor_z, speed=None, extend=False):
    """Foot_IK translation: inside every contact run the foot origin moves on a constant-velocity line (treadmill) between the run's
    end points (taken from the retargeted source) at floor height; the roll controls then pivot the sole on the contact points."""
    out = FP.copy()
    n = len(FP)
    for r in contact_runs(contact, loop):
        if len(r) < 2:
            out[r[0], 2] = floor_z
            continue
        pa, pb = FP[r[0], :2], FP[r[-1], :2]
        if speed is not None:  # same ground speed for every stance (both feet): keep the run's centre and direction, set its length
            c, dv = (pa + pb) / 2, pb - pa
            dv = dv / max(np.linalg.norm(dv), 1e-12)
            pa, pb = c - dv * speed * (len(r) - 1) / 2, c + dv * speed * (len(r) - 1) / 2
        for j, idx in enumerate(r):
            u = j / (len(r) - 1)
            out[idx, :2] = pa + (pb - pa) * u
            out[idx, 2] = floor_z
        # the frame just before touchdown / after lift-off keeps moving at the stance speed (no "pawing" at the floor edge of the contact)
        step = (pb - pa) / (len(r) - 1)
        L_ = n - 1 if loop else n
        before, after = (r[0] - 1) % L_ if (loop or r[0] > 0) else None, (r[-1] + 1) % L_ if (loop or r[-1] < L_ - 1) else None
        taken = {i for rr in contact_runs(contact, loop) for i in rr}
        if extend and before is not None and before not in taken:
            out[before, :2] = pa - step
            out[before, 2] = max(FP[before, 2], floor_z + 0.035)  # clear of the contact band at the stance speed
        if extend and after is not None and after not in taken:
            out[after, :2] = pb + step
            out[after, 2] = max(FP[after, 2], floor_z + 0.035)
    if loop:
        out[n - 1] = out[0]
    return out
