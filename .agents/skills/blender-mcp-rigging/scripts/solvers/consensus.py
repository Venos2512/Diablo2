r"""solvers.consensus - fuse landmark sources into landmarks.json + flags.json (references/joint-placement.md "Consensus rule",
revised after reviews r1, r2 and r3).

Units: metres.  Frame: Blender, Z up, front -Y, left +X.  Spreads and tolerances are reported in metres and as fractions of H.

Sources (rigcore.schema.LANDMARK_SOURCES):
  a  geometry (landmarks_geo -> landmarks_a.json, with its ``frame``: limb axes, midline, spine line)  weight 1.0 x method confidence
  b  watertight proxy + embedding (optional file)                                                     weight 0.7 x confidence
  d  UniRig (unirig_bridge -> landmarks_d.json)                                                       weight 0.7 x confidence
     SANITY ONLY for the landmarks in ``Config.sanity_only`` (default: pelvis, spine_01, spine_02, hips, ankles, clavicles -
     joint-placement.md step 2) until P5 measures its bias; ``Config.unirig_bias`` = {base id: {"bias_H": [bx, by, bz], "weight": w}}
     (fractions of H, subtracted from d) turns d back into a position source for that landmark. Default: no bias.
  c  family priors (z / H band) - a gate only, never moves a position
  e  the user (landmarks_override.json, {id: [x, y, z]}) - final
  vision decisions (vision_decisions.json, optional): the Opus ortho-crop check, one full decision record per landmark (below)

Rule per landmark (joint-placement.md "Consensus rule"):
 1. Plausibility gates per position source; any failed gate drops the source (``gates[source][gate]`` = "pass", "fail: ..." or
    "n/a: ..."):
      method  the source's own confidence >= Config.conf_floor (landmarks_geo lowers failed preconditions to 0.2)
      inside  winding number > 0.5 for joints (landmarks_geo.CORE); a tip (hand_tip, toe_tip, head_top) must end its limb: no mesh
              farther than tau beyond it along the limb direction (wrist -> tip, heel -> toe in the ground plane, up); ground points n/a
      axis    elbow, wrist, knee, ankle: within 0.5 x the local radius of the limb axis - the innermost closed loop of the section
              perpendicular to the limb (direction from source a's limb axes) that contains the candidate; head_top (I4): the head
              bone from a plausible head pivot candidate (the same source first, then a, b, d) within Config.head_top_arc_deg (25)
              of the arc between the body up axis and that source's neck direction and within Config.head_top_up_max_deg (60) of up
              (``_head_top_axis``): head_top has a single source, so this is what flags a wrong one (I3: an eye-island top 71 deg
              forward of up, S4's head bend test ambiguous)
      prior   family prior band on z / H (head_top exempt when source a found a helmet/hat island above the head)
      ratio   upper arm / forearm and thigh / shin of the source's own chain inside the family band (families/<F>.json
              plausibility.segment_ratio; ``Config.segment_ratio`` overrides it; 0.5-2.0 without either); a failing chain marks the
              smallest set of its joints whose replacement by another source's chain-passing joints fixes the ratio, else the middle
              joint (elbow / knee)
      mirror  the source's L and R positions agree in y and z (heights and depths; x is not mirror-symmetric on Tripo meshes: D01's
              deltoids flare 12 mm apart, FL's torso sits 39 mm off the hand-tip midline) within 2 class tau (without the local-radius
              term); the side farther from the other sources fails, both when there is no other source
 2. d on a sanity-only landmark is compared, never fused (``gates.d.role = "sanity"``, its distance to the result is recorded).
 3. tau = clamp(max(f_class H, 0.5 r_local), 0.6 % H, 3 % H); f_class 1.5 % limb joints, 3 % spine/neck/head/chest/clavicle/pelvis
    (convention), 2 % tips and ground points; r_local = distance from the reference candidate to the surface. Plausible sources that
    agree within tau -> weighted mean. Exactly one plausible source: a or b -> accepted, not flagged, confidence <= 0.6; d -> flagged
    "vision_only" (UniRig is a second opinion, SKILL.md: the vision check confirms or replaces it; the flag does not count toward the
    tiles), except when source a was dropped by the segment-ratio gate alone (review r3 F1: the gate blames joints of a chain, the
    survivor of a cross-joint gate is no measurement of this joint) -> flagged "vision" (counted), kind "ratio_disagree", provisional =
    d, impact from the a-d distance, choices a, d and "mean" (weighted mean of a and d; a and mean need gates_overridden "a.ratio");
    a boot ankle of source a (``interim_rule: "boot_ankle"``, joint-placement.md interim rules) -> accepted only when UniRig
    (sanity) agrees within tau, else flagged. A majority group that outweighs the rest -> its mean; otherwise flagged, provisional =
    source a when plausible, else the strongest plausible source; no plausible source -> flagged, provisional = the candidate with
    the fewest failed gates.
 4. The user override (e) is final. Vision decisions resolve flagged landmarks (below). Spine tile: when pelvis, spine_01 and
    spine_02 are all flagged they share one tile; once the pelvis is placed (vision or override) and the chest is unflagged,
    spine_01/02 are re-derived at 1/3 and 2/3 of the straight pelvis -> chest line (``spine_chord_point``; review r3 F2/F5: source
    a's spine line follows coats and belts). While the chest is still flagged they wait for it: pending in the spine tile, or
    escalated with the chest. Ground points defined as projections (ball_ground, toe_ground) are derived from their fused parent
    and share its tile.
 5. Tiles: one per centre landmark, L/R pairs together, the spine group as "spine", ordered by impact (class weight x max(spread /
    tau, a-d distance / tau for ratio_disagree, 3 when no source is plausible)). ``n_tiles`` counts the tiles before the vision check
    without the vision-only ones. ``ready_for_user`` is evaluated after the vision decisions: no tile may still wait for the vision
    check, and the escalated tiles - the user's flag sheet - must number <= Config.max_tiles (6), else the round goes back to the
    detectors.

Landmark ``flag`` (landmarks.json, flags.json): null (accepted), "vision" (waits for the vision check), "vision_only" (UniRig is the only
plausible source and source a did not fail the ratio gate alone), "escalated" (the vision check passed it to the user, or a spine_01/02
waiting for an escalated chest), "stale_vision_decision" (its decision's chosen position moved
more than Config.stale_tau_frac x tau since; needs a new check). ``auto_flagged`` / ``auto_flag`` keep the state before vision and
override; ``vision`` = {"status": "pending" | "applied" | "escalated" | "stale" | "rejected", ...}.

vision_decisions.json - {"decisions": {id: record}} or a bare {id: record} mapping, one record per landmark:
  {"choice": "a" | "b" | "d" | "mean" | "escalate",       never a free position
   "reason": "<anatomy row applied + what the crop shows>",
   "evidence": [{"path": "<crop image>", "view": "front" | "side" | "top" | ..., "sha256": "<64 hex>"}, ...],     at least one
   "inputs": {"landmarks_a": "<sha256>", "landmarks_d": "<sha256>" | null, "mesh": "<sha256>",
              "chosen_pos": [x, y, z]},    the chosen source's position (a, b, d), the weighted mean (mean: of the plausible sources; of a
                                           and d for ratio_disagree) or the provisional position (escalate) at decision time: flags.json
                                           tiles list them under ``choices``
   "gates_overridden": ["prior", ...],    every failed gate of the chosen source (flags.json ``gates_failed``); "sanity" to take a
                                           sanity-only UniRig position; "<source>.<gate>" works for any choice and is how "mean" names
                                           its sources' failed gates ("a.ratio" on ratio_disagree); flags.json tiles list the names per
                                           choice under ``required_overrides``
   "reviewer": {"model": "claude-opus-5-5", "date": "2026-10-23", "confidence": 0..1}}
  A record missing any of these, or not acknowledging a failed gate of the chosen source(s), is rejected (the landmark keeps waiting for
  the vision check; flags.json ``vision.rejected`` lists why). A complete record is applied while the chosen position is within
  Config.stale_tau_frac (0.25) x tau of ``chosen_pos``; else the landmark is flagged "stale_vision_decision". Input hashes that differ
  from the current files (flags.json ``inputs_sha256``) are reported; the position test decides. On a spine tile only the pelvis
  decision counts. An applied decision gets confidence min(0.6, reviewer confidence).

flags.json (the user's flag sheet and rigkit/render.py mode ``flag_tiles``):
  {schema, asset_id, family, H, ready_for_user, reasons, notes, max_tiles, n_tiles, n_vision_only_tiles, n_pending, n_escalated,
   n_resolved, user_tiles: [keys of the escalated tiles], tiles: [tile], flags: [{id, kind, flag, decision}] (flagged now),
   vision: {file, applied, escalated, stale: {id: {...}}, rejected: {id: [errors]}, unused: {id: why}}, single_source, prior_fail,
   summary, config, missing, inputs: {a, d, b, mesh, e, vision: paths}, inputs_sha256: {landmarks_a, landmarks_d, mesh}}
  tile = {"tile": 1.., "key": "knee" | "spine" | ..., "ids": [...], "class", "flag": "vision" | "vision_only",
          "status": "pending" | "escalated" | "resolved", "status_by_id": {id: same}, "impact", "tau_H", "grid_m" (0.01 H),
          "reasons": {id: decision text},
          "candidates": {id: {src: [x, y, z]}}        positions as fused (d bias-corrected when configured; a sanity-only d too),
          "sanity_only": {id: bool}                   d compared, never fused,
          "provisional": {id: [x, y, z]}, "provisional_source": {id: source or kind},
          "gates_failed": {id: {src: [gate, ...]}},
          "choices": {id: {choice: [x, y, z]}}        the chosen_pos a decision record carries per choice,
          "required_overrides": {id: {choice: ["<source>.<gate>", ...]}}     what its gates_overridden must list per choice,
          "vision": {id: {"status", ...}},
          "crop": {"centre", "half_size", "box_min", "box_max", "views": ["front", "side", "top"], "markers"}       the whole tile,
          "crops": {id: {"centre", "half_size", "box_min", "box_max"}}                                         one per landmark,
          "sections": {id: {"kind": "limb_perpendicular" | "sagittal", "plane": {"origin", "normal"},
                            "polylines": [{"closed": bool, "points": [[x, y, z], ...]}]}}}
    crop half size = max(3 tau, 0.6 x the candidates' extent, 0.02 H); sections = the mesh section through the provisional point,
    clipped to that landmark's crop box: perpendicular to the limb (source a's arm / leg axis; heel -> toe for ball and toe tip) for
    arm, leg and foot landmarks, sagittal (normal +X) for the centre landmarks and the clavicles; at most SECTION_MAX_POINTS points
    per polyline; empty without mesh.npz.

CLI:  python consensus.py --asset-id D01_hodling --family S [--a ...] [--d ...] [--b ...] [--mesh ...] [--override ...]
      [--vision ...] [--sanity-only pelvis,spine_01,spine_02,hip,ankle,clavicle] [--unirig-bias bias.json] [--out-dir ...]
      defaults: a = E:\tmp_rigkit\A2\<asset>\landmarks_a.json, d = E:\tmp_rigkit\A2\unirig\<asset>\landmarks_d.json, mesh = mesh.npz
      next to a, override / vision = <out-dir>\landmarks_override.json / vision_decisions.json when present, out-dir = folder of a
"""
from __future__ import annotations

import dataclasses
import hashlib
import itertools
import json
import math
import os
import re
import sys

import numpy as np

if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rigcore import SCHEMA, landmarks as rlm, npzio, schema, template  # noqa: E402

SCRATCH = r"E:\tmp_rigkit\A2"
POSITION_SOURCES = ("a", "b", "d")
LIMB = ("shoulder", "elbow", "wrist", "hip", "knee", "ankle", "ball")
CONVENTION = ("pelvis", "spine_01", "spine_02", "chest", "neck", "head", "clavicle")
TIP = ("hand_tip", "palm", "toe_tip", "head_top", "heel_ground", "ball_ground", "toe_ground")
AXIS_IDS = ("elbow", "wrist", "knee", "ankle")
CHAINS = {"arm": ("shoulder", "elbow", "wrist"), "leg": ("hip", "knee", "ankle")}
IMPACT = {"limb": 3.0, "convention": 2.0, "tip": 1.0}
#: ground points defined as projections (families/H.json rules): derived from the fused parent, never fused or flagged on their own
DERIVED = {"ball_ground": "ball", "toe_ground": "toe_tip"}
SPINE_GROUP = ("pelvis", "spine_01", "spine_02")
ARM_IDS = ("shoulder", "elbow", "wrist", "palm", "hand_tip")  # sections perpendicular to the arm axis
LEG_IDS = ("hip", "knee", "ankle")  # ... to the leg axis
FOOT_IDS = ("ball", "toe_tip")  # ... to the foot axis (heel -> toe)
GATES = ("method", "inside", "axis", "prior", "ratio", "mirror")
VISION_CHOICES = ("a", "b", "d", "mean", "escalate")
SECTION_MAX_POINTS = 400
_SHA256 = re.compile(r"^[0-9a-f]{64}$")
_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}")


@dataclasses.dataclass
class Config:
    """Consensus parameters (proposals; calibrate at P5 on tier-1 rigs, never on G2)."""

    weights: dict = dataclasses.field(default_factory=lambda: {"a": 1.0, "b": 0.7, "d": 0.7})
    conf_floor: float = 0.25
    sanity_only: tuple = ("pelvis", "spine_01", "spine_02", "hip", "ankle", "clavicle")
    unirig_bias: dict = dataclasses.field(default_factory=dict)
    f_class: dict = dataclasses.field(default_factory=lambda: {"limb": 0.015, "convention": 0.03, "tip": 0.02})
    tau_min_H: float = 0.006
    tau_max_H: float = 0.03
    single_conf_max: float = 0.6
    segment_ratio: dict | None = None  # {"arm": (lo, hi), "leg": (lo, hi)}; None = the family's plausibility.segment_ratio
    mirror_k: float = 2.0
    max_tiles: int = 6
    stale_tau_frac: float = 0.25  # a vision decision applies while its chosen position stays within this x tau
    vision_conf_max: float = 0.6
    head_top_arc_deg: float = 25.0  # head_top axis gate: head bone within this of the arc from up to the neck direction (I4)
    head_top_up_max_deg: float = 60.0  # ... and within this of up (S4's head bend test loses its sign beyond ~65 deg)

    def to_json(self) -> dict:
        return {k: (list(v) if isinstance(v, tuple) else v) for k, v in dataclasses.asdict(self).items()}


def base_id(lid: str) -> str:
    return lid[:-2] if lid.endswith(("_L", "_R")) else lid


def side_of(lid: str) -> str | None:
    return lid[-1] if lid.endswith(("_L", "_R")) else None


def landmark_class(lid: str) -> str:
    b = base_id(lid)
    return "limb" if b in LIMB else ("convention" if b in CONVENTION else "tip")


def segment_ratio_bands(family: dict, cfg: Config | None = None) -> dict:
    """Segment-ratio gate bands ``{"arm": (lo, hi), "leg": (lo, hi), "source": text}``: ``Config.segment_ratio`` when set, else
    families/<F>.json ``plausibility.segment_ratio`` (``arm_upper_over_fore``, ``leg_thigh_over_shin``), else the gross band 0.5-2.0."""
    if cfg is not None and cfg.segment_ratio:
        return {"arm": tuple(cfg.segment_ratio["arm"]), "leg": tuple(cfg.segment_ratio["leg"]), "source": "Config.segment_ratio"}
    sr = (family.get("plausibility") or {}).get("segment_ratio") or {}
    if "arm_upper_over_fore" in sr and "leg_thigh_over_shin" in sr:
        return {"arm": tuple(float(v) for v in sr["arm_upper_over_fore"]), "leg": tuple(float(v) for v in sr["leg_thigh_over_shin"]),
                "source": f"families/{family.get('family', '?')}.json plausibility.segment_ratio"}
    return {"arm": (0.5, 2.0), "leg": (0.5, 2.0), "source": "gross band (no plausibility.segment_ratio in the family)"}


def load_source(path) -> tuple[dict, dict]:
    """landmarks.json-format file of one source -> (``{id: {"pos", "confidence", "method", "prior_exempt"?, "interim_rule"?,
    "interim_note"?}}``, top-level ``frame`` or {}). Also accepts a bare ``{id: [x, y, z]}`` mapping (confidence 1.0)."""
    doc = npzio.read_json(path)
    entries = doc["landmarks"] if isinstance(doc, dict) and "landmarks" in doc and "schema" in doc else doc
    out = {}
    for lid, e in entries.items():
        if isinstance(e, dict):
            c = e.get("confidence", 1.0)
            out[lid] = {"pos": tuple(float(v) for v in e["pos"]), "confidence": float(c) if schema.is_num(c) else 1.0,
                        "method": e.get("decision", "")}
            for k in ("prior_exempt", "interim_rule", "interim_note"):
                if e.get(k):
                    out[lid][k] = e[k]
        else:
            out[lid] = {"pos": tuple(float(v) for v in e), "confidence": 1.0, "method": ""}
    frame = doc.get("frame", {}) if isinstance(doc, dict) else {}
    return out, frame or {}


def load_vision(path) -> dict:
    """vision_decisions.json -> {id: record}: ``{"decisions": {...}}`` or a bare mapping (top-level schema/asset keys ignored)."""
    doc = npzio.read_json(path)
    if isinstance(doc, dict) and isinstance(doc.get("decisions"), dict):
        return dict(doc["decisions"])
    if isinstance(doc, dict):
        return {k: v for k, v in doc.items() if k not in ("schema", "asset_id", "family", "H", "notes")}
    return {}


def file_sha256(path) -> str | None:
    """SHA-256 hex digest of a file, None when there is no such file."""
    if not path or not os.path.isfile(path):
        return None
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


# --------------------------------------------------------------------------------------------------------------------------
# geometry for the gates and the tiles
# --------------------------------------------------------------------------------------------------------------------------


class GateGeometry:
    """Mesh queries for the gates and the flag tiles: winding number, local radius (distance to the surface), the limb-axis section
    test and clipped section polylines. ``frame`` = source a's frame (``limb_axes``: arm_L/arm_R/leg_L/leg_R centroid polylines)."""

    def __init__(self, mesh: dict, frame: dict | None = None):
        from solvers import landmarks_geo as lg

        self.lg = lg
        self.geom = lg.MeshGeom(mesh["V"], mesh["F"], mesh["weld"])
        self.axes = {k: np.asarray(v, dtype=np.float64) for k, v in ((frame or {}).get("limb_axes") or {}).items() if len(v) >= 3}

    def winding(self, p) -> float:
        return float(self.geom.winding(np.asarray(p, dtype=np.float64)[None])[0])

    def r_local(self, p) -> float:
        return float(self.geom.closest(np.asarray(p, dtype=np.float64)[None])[0][0])

    @staticmethod
    def axis_key(lid: str) -> str | None:
        """Source a's limb axis for a sided landmark: ``arm_<S>`` for the arm and hand, ``leg_<S>`` for the leg joints."""
        b, s = base_id(lid), side_of(lid)
        if not s:
            return None
        return ("arm_" + s) if b in ARM_IDS else (("leg_" + s) if b in LEG_IDS else None)

    def limb_direction(self, lid: str, p) -> np.ndarray | None:
        key = self.axis_key(lid)
        C = self.axes.get(key) if key else None
        if C is None:
            return None
        i = int(np.argmin(np.linalg.norm(C - np.asarray(p, dtype=np.float64), axis=1)))
        d = C[min(i + 2, len(C) - 1)] - C[max(i - 2, 0)]
        n = float(np.linalg.norm(d))
        return d / n if n > 1e-12 else None

    def end_test(self, p, direction, tau: float) -> tuple[bool, float]:
        """Does ``p`` end its limb? The last surface crossing of the ray from ``p`` along ``direction`` lies within ``tau``."""
        t = self.geom.ray_hits(np.asarray(p, dtype=np.float64)[None], np.asarray(direction, dtype=np.float64)[None])[0]
        ahead = float(t[-1]) if t.size else 0.0
        return ahead <= tau, ahead

    def axis_test(self, lid: str, p, direction=None) -> tuple[bool | None, dict]:
        """(pass, info): is ``p`` within 0.5 x the local radius of the limb axis? The limb section through ``p`` perpendicular to the
        limb direction; the innermost closed loop containing ``p`` is the limb (cuffs and sleeves are larger loops)."""
        d = self.limb_direction(lid, p) if direction is None else direction
        if d is None:
            return None, {"why": "no limb direction"}
        p = np.asarray(p, dtype=np.float64)
        loops = [lp for lp in self.geom.section(p, d) if lp.closed and self.lg.loop_contains(lp, p)]
        if not loops:
            return False, {"why": "no closed limb section around the candidate"}
        lp = min(loops, key=lambda q: q.area)
        r = math.sqrt(max(lp.area, 0.0) / math.pi)
        off = p - lp.centroid
        off = off - (off @ d) * d
        rad = float(np.linalg.norm(off))
        return rad <= 0.5 * r, {"radial_m": rad, "r_local_m": r}

    def section_plane(self, lid: str, p, fused: dict | None = None) -> tuple[np.ndarray, str]:
        """(unit normal, kind) of the tile section through a landmark: perpendicular to the limb for arm, leg and foot landmarks
        (source a's axis; heel_ground -> toe_tip in the ground plane for the foot; X / Z / -Y when missing), else sagittal (+X)."""
        b, s = base_id(lid), side_of(lid)
        if s and (b in ARM_IDS or b in LEG_IDS):
            d = self.limb_direction(lid, p)
            if d is None:
                d = np.array([1.0, 0.0, 0.0]) if b in ARM_IDS else np.array([0.0, 0.0, 1.0])
            return d, "limb_perpendicular"
        if s and b in FOOT_IDS:
            d = np.array([0.0, -1.0, 0.0])
            heel, toe = (fused or {}).get(f"heel_ground_{s}"), (fused or {}).get(f"toe_tip_{s}")
            if heel is not None and toe is not None:
                v = np.asarray(toe["pos"], dtype=np.float64) - np.asarray(heel["pos"], dtype=np.float64)
                v[2] = 0.0
                if np.linalg.norm(v) > 1e-9:
                    d = v / np.linalg.norm(v)
            return d, "limb_perpendicular"
        return np.array([1.0, 0.0, 0.0]), "sagittal"

    def section_polylines(self, origin, normal, lo, hi, max_points: int = SECTION_MAX_POINTS) -> list[dict]:
        """Mesh section through ``origin`` with ``normal``, clipped to the box [``lo``, ``hi``]: runs of consecutive loop points inside
        the box (a loop entirely inside stays closed), each at most ``max_points`` points, rounded to 10 um."""
        lo, hi = np.asarray(lo, dtype=np.float64), np.asarray(hi, dtype=np.float64)
        out = []
        for lp in self.geom.section(np.asarray(origin, dtype=np.float64), np.asarray(normal, dtype=np.float64)):
            P = lp.points
            ins = np.all((P >= lo) & (P <= hi), axis=1)
            if not ins.any():
                continue
            if lp.closed and ins.all():
                runs = [(P, True)]
            else:
                if lp.closed:  # start the walk at an outside point so that no run wraps around
                    k = int(np.argmin(ins))
                    P, ins = np.roll(P, -k, axis=0), np.roll(ins, -k)
                idx = np.flatnonzero(ins)
                runs = [(P[g], False) for g in np.split(idx, np.flatnonzero(np.diff(idx) > 1) + 1) if len(g) >= 2]
            for Q, closed in runs:
                if len(Q) > max_points:
                    Q = Q[np.unique(np.linspace(0, len(Q) - 1, max_points).round().astype(int))]
                out.append({"closed": bool(closed), "points": np.round(Q, 5).tolist()})
        return out


# --------------------------------------------------------------------------------------------------------------------------
# gates
# --------------------------------------------------------------------------------------------------------------------------


def _fmt(x) -> str:
    return f"{x * 1000:.1f} mm"


def tau_of(lid: str, H: float, r_local: float | None, cfg: Config) -> float:
    """Class tolerance tau = clamp(max(f_class H, 0.5 r_local), tau_min H, tau_max H) (metres)."""
    t = cfg.f_class[landmark_class(lid)] * H
    if r_local is not None and math.isfinite(r_local):
        t = max(t, 0.5 * r_local)
    return float(min(max(t, cfg.tau_min_H * H), cfg.tau_max_H * H))


def compute_gates(cands: dict, H: float, family: dict, cfg: Config, gg: GateGeometry | None, prior_exempt: dict) -> dict:
    """Gates for every (landmark, source) candidate. ``cands`` = {lid: {src: {"pos", "confidence"}}} (position sources, d already
    bias-corrected). Returns {lid: {src: {gate: text}}}."""
    from solvers.landmarks_geo import CORE

    priors = family.get("priors", {})
    bands = segment_ratio_bands(family, cfg)
    G: dict = {lid: {s: {} for s in c} for lid, c in cands.items()}
    tau = {lid: tau_of(lid, H, None, cfg) for lid in cands}
    for lid, c in cands.items():
        b = base_id(lid)
        for s, e in c.items():
            g = G[lid][s]
            p = np.asarray(e["pos"], dtype=np.float64)
            conf = float(e.get("confidence", 1.0))
            g["method"] = "pass" if conf >= cfg.conf_floor else f"fail: source confidence {conf:.2f} < {cfg.conf_floor}"
            if gg is None:
                g["inside"] = g["axis"] = "n/a: no mesh"
            else:
                if b in CORE:
                    w = gg.winding(p)
                    g["inside"] = "pass" if w > 0.5 else f"fail: winding {w:.2f} (outside the mesh)"
                elif b in TIP_DIRS:
                    dv = _tip_direction(lid, cands, s)
                    if b == "head_top" and lid in prior_exempt:
                        g["inside"] = f"n/a: {prior_exempt[lid]}"
                    elif dv is None:
                        g["inside"] = "n/a: no limb direction for the tip"
                    else:
                        ok, ahead = gg.end_test(p, dv, tau[lid])
                        g["inside"] = (f"pass (limb end: {_fmt(ahead)} of mesh ahead)" if ok else
                                       f"fail: {_fmt(ahead)} of mesh beyond the tip > tau {_fmt(tau[lid])} (not the limb end)")
                else:
                    g["inside"] = "n/a: ground point"
                if b in AXIS_IDS:
                    ok, info = gg.axis_test(lid, p)
                    g["axis"] = ("n/a: " + info["why"]) if ok is None else (
                        "pass" if ok else (f"fail: {info['why']}" if "why" in info else
                                           f"fail: {_fmt(info['radial_m'])} off the limb axis > 0.5 x r {_fmt(info['r_local_m'])}"))
                else:
                    g["axis"] = "n/a"
            pr = priors.get(b)
            if pr is None:
                g["prior"] = "n/a"
            elif lid in prior_exempt:
                g["prior"] = f"n/a: exempt ({prior_exempt[lid]})"
            else:
                z = p[2] / H
                g["prior"] = "pass" if abs(z - pr["z_over_H"]) <= pr["tol_H"] else (
                    f"fail: z/H {z:.3f} outside {pr['z_over_H']} +- {pr['tol_H']}")
            g["ratio"] = "n/a"
            g["mirror"] = "n/a"
    # segment-length ratios per source chain (family bands)
    for side in ("L", "R"):
        for chain, joints in CHAINS.items():
            ids = [f"{j}_{side}" for j in joints]
            lo, hi = bands[chain]
            srcs = [s for s in POSITION_SOURCES if all(i in cands and s in cands[i] for i in ids)]
            ratio = {s: _ratio(*(cands[i][s]["pos"] for i in ids)) for s in srcs}
            ok = {s: lo <= r <= hi for s, r in ratio.items()}
            for s in srcs:
                if ok[s]:
                    for i in ids:
                        G[i][s]["ratio"] = f"pass ({chain} ratio {ratio[s]:.2f})"
                    continue
                blamed, by_replacement = _ratio_culprits(s, ids, cands, ok, lo, hi)
                why = "the smallest replacement that fixes it" if by_replacement else "the chain's middle joint (no donor chain)"
                for i in ids:
                    if i in blamed:
                        G[i][s]["ratio"] = f"fail: {chain} ratio {ratio[s]:.2f} outside {lo}-{hi}; this joint is {why}"
                    else:
                        G[i][s]["ratio"] = f"pass (chain ratio {ratio[s]:.2f} fails; blamed on {', '.join(blamed)})"
    # mirror consistency in y and z
    pairs = sorted({base_id(l) for l in cands if side_of(l)})
    for b in pairs:
        L, R = f"{b}_L", f"{b}_R"
        if L not in cands or R not in cands:
            continue
        for s in POSITION_SOURCES:
            if s not in cands[L] or s not in cands[R]:
                continue
            pL, pR = np.asarray(cands[L][s]["pos"]), np.asarray(cands[R][s]["pos"])
            dyz = float(np.linalg.norm((pL - pR)[1:]))
            tol = cfg.mirror_k * max(tau[L], tau[R])
            if dyz <= tol:
                G[L][s]["mirror"] = G[R][s]["mirror"] = f"pass ({_fmt(dyz)} in y/z)"
                continue
            dist = {}
            for lid, p in ((L, pL), (R, pR)):
                others = [np.asarray(cands[lid][t]["pos"]) for t in cands[lid] if t != s]
                dist[lid] = min((float(np.linalg.norm(p - q)) for q in others), default=None)
            txt = f"fail: L/R differ by {_fmt(dyz)} in y/z > {cfg.mirror_k:g} tau {_fmt(tol)}"
            if dist[L] is None or dist[R] is None:
                G[L][s]["mirror"] = G[R][s]["mirror"] = txt + " (no other source to tell the sides apart)"
            else:
                bad = L if dist[L] > dist[R] else R
                good = R if bad == L else L
                G[bad][s]["mirror"] = txt + f"; this side is {_fmt(dist[bad])} from the other sources"
                G[good][s]["mirror"] = f"pass (pair differs by {_fmt(dyz)}; the other side is blamed)"
    # head bone direction for the head top (I4), after the head pivot's own gates
    for lid in [x for x in cands if base_id(x) == "head_top"]:
        for s in cands[lid]:
            G[lid][s]["axis"] = _head_top_axis(lid, s, cands, G, cfg)
    return G


def _head_top_axis(lid: str, s: str, cands: dict, G: dict, cfg: Config) -> str:
    """Axis gate of a head top (joint-placement.md Head; I4): the head bone from a head pivot candidate to source ``s``'s head top
    must lie within ``cfg.head_top_arc_deg`` of the arc between the body up axis and that source's neck direction (neck -> pivot;
    ``landmarks_geo.head_axis_deviation``) and within ``cfg.head_top_up_max_deg`` of up. Pivots tried: source ``s``, then a, b, d,
    each only when its own head gates pass (a sanity-only d is skipped); one plausible head bone passes the gate, so a doubtful
    pivot - flagged on its own head tile - does not fail a good head top. I3: D01's head top on an eye island made the head bone 71
    deg off up (77 deg from UniRig's pivot) and S4's head bend test ambiguous, and the single source was accepted unflagged."""
    from solvers.landmarks_geo import head_axis_deviation

    heads, necks = cands.get("head", {}), cands.get("neck", {})
    sanity_d = "head" in cfg.sanity_only and "head" not in cfg.unirig_bias
    tried = []
    for t in dict.fromkeys([s, "a", "b", "d"]):
        if t not in heads or (t == "d" and sanity_d) or not _plausible(G.get("head", {}).get(t, {})):
            continue
        nk = necks.get(t) or necks.get("a")
        dev = head_axis_deviation(heads[t]["pos"], cands[lid][s]["pos"], nk["pos"] if nk else None)
        if dev is None:
            continue
        ok = dev["arc_deg"] <= cfg.head_top_arc_deg and dev["up_deg"] <= cfg.head_top_up_max_deg
        tried.append((not ok, dev["arc_deg"], t, dev))
    if not tried:
        return "n/a: no plausible head pivot"
    bad, _, t, dev = min(tried, key=lambda x: (x[0], x[1]))
    txt = (f"head bone from pivot {t}: {dev['up_deg']:.1f} deg from up, {dev['arc_deg']:.1f} deg from the up-neck arc"
           + (f" (neck {dev['neck_deg']:.1f} deg)" if dev["neck_deg"] is not None else ""))
    if not bad:
        return f"pass ({txt})"
    return (f"fail: {txt}; limits {cfg.head_top_arc_deg:g} deg from the arc and {cfg.head_top_up_max_deg:g} deg from up "
            f"(tried pivots {', '.join(x[2] for x in tried)})")


TIP_DIRS = ("hand_tip", "toe_tip", "head_top")


def _tip_direction(lid: str, cands: dict, s: str):
    """Outward limb direction at a tip: wrist -> hand_tip, heel_ground (else ball) -> toe_tip in the ground plane, +Z for head_top;
    the proximal point from source a when present, else from the same source."""
    b, side = base_id(lid), side_of(lid)
    if b == "head_top":
        return np.array([0.0, 0.0, 1.0])
    prox = [f"wrist_{side}"] if b == "hand_tip" else [f"heel_ground_{side}", f"ball_ground_{side}", f"ball_{side}"]
    for pid in prox:
        for t in ("a", s):
            if pid in cands and t in cands[pid]:
                d = np.asarray(cands[lid][s]["pos"], dtype=np.float64) - np.asarray(cands[pid][t]["pos"], dtype=np.float64)
                if b == "toe_tip":
                    d[2] = 0.0
                n = float(np.linalg.norm(d))
                if n > 1e-9:
                    return d / n
    return None


def _ratio(p0, p1, p2) -> float:
    a = float(np.linalg.norm(np.asarray(p1, dtype=np.float64) - np.asarray(p0, dtype=np.float64)))
    b = float(np.linalg.norm(np.asarray(p2, dtype=np.float64) - np.asarray(p1, dtype=np.float64)))
    return a / b if b > 1e-12 else math.inf


def _ratio_culprits(s: str, ids: list, cands: dict, ok: dict, lo: float, hi: float) -> tuple[list, bool]:
    """Joints of source ``s``'s failing chain to blame: the smallest subset whose replacement by the joints of another source with a
    passing chain brings the ratio into [lo, hi] (ties: the subset with the larger displacement); without one, the middle joint.
    Returns (ids, found_by_replacement)."""
    donors = [t for t, good in ok.items() if good and t != s]
    best = None
    for k in (1, 2):
        for sub in itertools.combinations(range(3), k):
            for t in donors:
                P = [cands[ids[j]][t]["pos"] if j in sub else cands[ids[j]][s]["pos"] for j in range(3)]
                if lo <= _ratio(*P) <= hi:
                    disp = sum(float(np.linalg.norm(np.asarray(cands[ids[j]][s]["pos"]) - np.asarray(cands[ids[j]][t]["pos"])))
                               for j in sub)
                    if best is None or disp > best[0]:
                        best = (disp, [ids[j] for j in sub])
        if best is not None:
            return best[1], True
    return [ids[1]], False


def _plausible(g: dict) -> bool:
    return all(not str(v).startswith("fail") for k, v in g.items() if k in GATES)


def _n_fail(g: dict) -> int:
    return sum(1 for k, v in g.items() if k in GATES and str(v).startswith("fail"))


# --------------------------------------------------------------------------------------------------------------------------
# fusion
# --------------------------------------------------------------------------------------------------------------------------


def _groups(keys, P, thr):
    """Largest subsets of source keys whose positions agree pairwise within ``thr`` (at most 3-4 sources)."""
    for r in range(len(keys), 0, -1):
        found = [[keys[i] for i in comb] for comb in itertools.combinations(range(len(keys)), r)
                 if all(np.linalg.norm(P[i] - P[j]) <= thr for i, j in itertools.combinations(comb, 2))]
        if found:
            return found
    return []


def spine_chord_point(pelvis, chest, frac: float) -> np.ndarray:
    """Point at ``frac`` of the straight line from ``pelvis`` to ``chest`` (re-derivation of spine_01/02 at 1/3 and 2/3 once the
    pelvis is placed). Review r3 F2: source a's spine line carries coat and belt contours (FL: a 10-13 mm bump at the belt; D01: an
    18 mm y-step that put spine_01 11.8 mm low when measured along its arc length), so it is not followed. Revisit together with the
    spine-depth convention at P5."""
    P, C = np.asarray(pelvis, dtype=np.float64), np.asarray(chest, dtype=np.float64)
    return P + float(frac) * (C - P)


def _spine_line_offset(line, p) -> float | None:
    """Horizontal distance (m) from ``p`` to source a's spine line (frame ``spine_line``) at ``p``'s height; None without a line or
    outside its height range. Recorded with the re-derived spine points (P5 revisit of the spine-depth convention)."""
    L = np.asarray(line, dtype=np.float64) if line is not None and len(line) >= 2 else None
    if L is None:
        return None
    L = L[np.argsort(L[:, 2])]
    z = float(p[2])
    if not L[0, 2] <= z <= L[-1, 2]:
        return None
    return float(math.hypot(float(p[0]) - np.interp(z, L[:, 2], L[:, 0]), float(p[1]) - np.interp(z, L[:, 2], L[:, 1])))


def fuse(sources: dict, H: float, family: dict, cfg: Config | None = None, gg: GateGeometry | None = None, override: dict | None = None,
         vision: dict | None = None, frame: dict | None = None, input_sha256: dict | None = None) -> tuple[dict, dict]:
    """Fuse all landmarks. ``sources`` = {"a": {id: entry}, "d": {...}, "b": {...}} (entries from ``load_source``); ``gg`` = mesh
    queries (None: geometric gates are n/a, tiles get no sections); ``override`` = {id: (x, y, z)}; ``vision`` = {id: decision
    record} (module docstring); ``frame`` = source a's frame (its spine line's offset from the re-derived spine points is recorded);
    ``input_sha256`` = current input hashes
    {landmarks_a, landmarks_d, mesh} compared with the records. Returns ``(fused, report)``."""
    cfg = cfg or Config()
    wanted = rlm.landmark_ids(family)
    ids = list(wanted) + sorted({k for s in sources.values() for k in s} - set(wanted))
    sanity = set(cfg.sanity_only) - set(cfg.unirig_bias)
    prior_exempt = {lid: e["prior_exempt"] for lid, e in sources.get("a", {}).items() if e.get("prior_exempt")}
    override = override or {}
    cands: dict = {}
    raw_d: dict = {}
    for lid in ids:
        c = {}
        for s in POSITION_SOURCES:
            if s in sources and lid in sources[s]:
                e = dict(sources[s][lid])
                if s == "d":
                    raw_d[lid] = e["pos"]
                    bias = cfg.unirig_bias.get(base_id(lid))
                    if bias:
                        e["pos"] = tuple(float(v) - float(bb) * H for v, bb in zip(e["pos"], bias.get("bias_H", (0, 0, 0))))
                c[s] = e
        if c:
            cands[lid] = c
    G = compute_gates(cands, H, family, cfg, gg, prior_exempt)
    fused, missing = {}, []
    for lid in ids:
        c = cands.get(lid, {})
        if not c and lid not in override:
            if lid in wanted:
                missing.append(lid)
            continue
        f = _fuse_one(lid, c, G.get(lid, {}), H, cfg, gg, sanity, raw_d) if c else _no_source(lid, H, cfg)
        f.update(auto_flagged=f["flagged"], auto_flag=f["flag"], auto_kind=f["kind"], auto_decision=f["decision"],
                 auto_pos=np.asarray(f["pos"], dtype=np.float64).copy())
        fused[lid] = f
    for lid, p in override.items():  # the user override is final
        if lid in fused:
            f = fused[lid]
            f["sources"]["e"] = [float(v) for v in p]
            f.update(pos=np.asarray(p, dtype=np.float64), decision="user override (landmarks_override.json); automatic: " + f["decision"],
                     confidence=1.0, flagged=False, flag=None, kind="override")
    derived = {}  # ground points = projections of their fused parent: never flagged on their own, placed after the vision step
    for lid, f in fused.items():
        parent = DERIVED.get(base_id(lid))
        pl = f"{parent}_{side_of(lid)}" if parent and side_of(lid) else None
        if pl in fused and f["kind"] != "override":
            derived[lid] = pl
            f.update(auto_flagged=False, auto_flag=None)
    spine_group = all(fused.get(k, {}).get("auto_flagged") for k in SPINE_GROUP)
    vrep = _apply_vision(fused, vision or {}, H, cfg, input_sha256 or {}, spine_group)
    if spine_group:
        _derive_spine(fused, frame, cfg, H)
    for lid, pl in derived.items():
        f, q = fused[lid], fused[pl]
        f.update(pos=np.array([q["pos"][0], q["pos"][1], 0.0]), flagged=False, flag=None, kind="derived", confidence=q["confidence"],
                 decision=f"derived: {pl} ({q['kind']}{', flagged' if q['flagged'] else ''}) projected to z = 0 (families rule); "
                          f"own sources spread {f['spread_all_H']:.2%} H")
    for lid, f in fused.items():  # prior source c (z only) for the record
        pr = family.get("priors", {}).get(base_id(lid))
        if pr is not None:
            f["sources"]["c"] = [float(f["pos"][0]), float(f["pos"][1]), float(pr["z_over_H"]) * H]
    report = flag_report(fused, H, cfg, gg, spine_group, vrep)
    report["missing"] = missing
    report["config"]["segment_ratio_bands"] = {k: (list(v) if isinstance(v, tuple) else v)
                                               for k, v in segment_ratio_bands(family, cfg).items()}
    return fused, report


def _no_source(lid: str, H: float, cfg: Config) -> dict:
    """Entry of a landmark that only the user override gives."""
    tau = tau_of(lid, H, None, cfg)
    return {"sources": {}, "gates": {}, "tau": tau, "tau_H": tau / H, "class": landmark_class(lid), "plausible": [], "spread": 0.0,
            "spread_H": 0.0, "spread_all_H": 0.0, "r_local": None, "cand_pos": {}, "weights": {}, "is_sanity": False,
            "gates_failed": {}, "pos": np.zeros(3), "decision": "no source", "confidence": 0.0, "flagged": True, "flag": "vision",
            "kind": "no_plausible"}


def _fuse_one(lid: str, c: dict, g: dict, H: float, cfg: Config, gg, sanity: set, raw_d) -> dict:
    """Automatic result of one landmark (rule steps 1-3; override and vision are applied by ``fuse``)."""
    W = cfg.weights
    src = {k: [float(v) for v in e["pos"]] for k, e in c.items()}
    if lid in raw_d:  # record UniRig's raw position (a bias correction shows in gates.d.role)
        src["d"] = [float(v) for v in raw_d[lid]]
    is_sanity = base_id(lid) in sanity and "d" in c
    gates = {s: dict(g.get(s, {})) for s in c}
    if is_sanity:
        gates["d"]["role"] = "sanity (UniRig bias unknown until P5: compared, never fused)"
    elif "d" in c and base_id(lid) in cfg.unirig_bias:
        gates["d"]["role"] = f"bias-corrected by {cfg.unirig_bias[base_id(lid)].get('bias_H')} H"
    pos_src = [s for s in POSITION_SOURCES if s in c and not (s == "d" and is_sanity)]
    plaus = [s for s in pos_src if _plausible(gates[s])]
    ref = c["a"]["pos"] if "a" in c else np.mean([c[s]["pos"] for s in c], axis=0)
    r_loc = gg.r_local(ref) if gg is not None and (gg.winding(ref) > 0.5) else None
    tau = tau_of(lid, H, r_loc, cfg)

    def weight(s):
        ws = W.get(s, 0.0)
        if s == "d" and base_id(lid) in cfg.unirig_bias:
            ws = float(cfg.unirig_bias[base_id(lid)].get("weight", ws))
        return ws * float(c[s].get("confidence", 1.0))

    w = {s: weight(s) for s in c}
    P = {s: np.asarray(c[s]["pos"], dtype=np.float64) for s in c}
    spread = max((float(np.linalg.norm(P[i] - P[j])) for i, j in itertools.combinations(plaus, 2)), default=0.0)
    spread_all = max((float(np.linalg.norm(P[i] - P[j])) for i, j in itertools.combinations(pos_src, 2)), default=0.0)
    base = {"sources": src, "gates": gates, "tau": tau, "tau_H": tau / H, "class": landmark_class(lid), "plausible": plaus,
            "spread": spread, "spread_H": spread / H, "spread_all_H": spread_all / H, "r_local": r_loc,
            "cand_pos": {s: [float(v) for v in P[s]] for s in c}, "weights": {s: float(v) for s, v in w.items()},
            "is_sanity": is_sanity,
            "gates_failed": {s: [k for k, v in gates[s].items() if k in GATES and str(v).startswith("fail")] for s in c}}
    dropped = [s for s in pos_src if s not in plaus]
    drop_txt = ("; dropped " + ", ".join(f"{s} ({'; '.join(k + ' ' + v for k, v in gates[s].items() if str(v).startswith('fail'))})"
                                         for s in dropped)) if dropped else ""
    if not plaus:
        cand = [s for s in c]  # incl. a sanity-only d as a last-resort provisional position
        kb = min(cand, key=lambda s: (_n_fail(gates[s]), -w[s]))
        out = dict(base, pos=P[kb], decision=f"flagged: no plausible source{drop_txt}; provisional = {kb} (fewest failed gates)",
                   confidence=0.1, flagged=True, flag="vision", kind="no_plausible", provisional=kb)
    elif len(plaus) == 1:
        s = plaus[0]
        conf = float(min(cfg.single_conf_max, c[s].get("confidence", 1.0)))
        if s == "d" and "a" in c and base["gates_failed"]["a"] == ["ratio"]:
            out = _ratio_disagree_result(base, P, tau, H, conf, drop_txt)
        elif s == "d":
            out = dict(base, pos=P[s], decision=f"single plausible source d (UniRig){drop_txt}: vision-only flag (UniRig is a second "
                       "opinion; the vision check confirms or replaces it)", confidence=conf, flagged=True, flag="vision_only",
                       kind="single", provisional="d")
        elif s == "a" and c["a"].get("interim_rule") == "boot_ankle":
            out = _boot_ankle_result(base, c, P, tau, H, conf, drop_txt)
        else:
            out = dict(base, pos=P[s], decision=f"single plausible source {s}: accepted{drop_txt}", confidence=conf, flagged=False,
                       flag=None, kind="single")
    else:
        Pp = np.array([P[s] for s in plaus])
        wp = np.array([max(w[s], 1e-6) for s in plaus])
        if spread <= tau:
            pos = (Pp * wp[:, None]).sum(0) / wp.sum()
            out = dict(base, pos=pos, decision=f"{'+'.join(plaus)} agree within tau {tau / H:.2%} H (spread {spread / H:.2%} H): weighted mean"
                       + drop_txt, confidence=float(min(1.0, wp.sum() / sum(W.get(s, 0.0) for s in plaus))), flagged=False, flag=None,
                       kind="agree")
        else:
            grp = [gr for gr in _groups(plaus, Pp, tau) if len(gr) >= 2]
            best = max(grp, key=lambda gr: sum(w[s] for s in gr)) if grp else None
            if best is not None and sum(w[s] for s in best) > sum(w[s] for s in plaus if s not in best):
                idx = [plaus.index(s) for s in best]
                pos = (Pp[idx] * wp[idx, None]).sum(0) / wp[idx].sum()
                rest = [s for s in plaus if s not in best]
                out = dict(base, pos=pos, decision=f"{'+'.join(best)} agree within tau; outvoted " + ", ".join(
                    f"{s} ({np.linalg.norm(P[s] - pos) / H:.2%} H away)" for s in rest) + drop_txt,
                    confidence=float(min(1.0, sum(w[s] for s in best) / sum(W.get(s, 0.0) for s in plaus))) * 0.9, flagged=False,
                    flag=None, kind="majority")
            else:
                kb = "a" if "a" in plaus else max(plaus, key=lambda s: w[s])
                out = dict(base, pos=P[kb], decision=f"flagged: plausible sources {'+'.join(plaus)} disagree (spread {spread / H:.2%} H > tau "
                           f"{tau / H:.2%} H); provisional = {kb} ({'geometry' if kb == 'a' else 'largest weight x confidence'})"
                           f"{drop_txt}; needs the vision check",
                           confidence=float(w[kb] / wp.sum()) * 0.5, flagged=True, flag="vision", kind="disagree", provisional=kb)
    if is_sanity:
        dd = float(np.linalg.norm(np.asarray(c["d"]["pos"]) - np.asarray(out["pos"])))
        gates["d"]["sanity_dist_H"] = round(dd / H, 4)
        out["decision"] += f"; UniRig (sanity only) {dd / H:.2%} H away"
    return out


def _ratio_disagree_result(base: dict, P: dict, tau: float, H: float, conf: float, drop_txt: str) -> dict:
    """Review r3 F1 (joint-placement.md step 2): source a dropped by the segment-ratio gate alone leaves UniRig as the single plausible
    source, but the gate blames joints of a chain (FL wrist_R: a 2.4 cm into the hand, d 3.8 cm inside the bracer; the joint lies near
    their mean). A counted tile, not a vision-only flag: kind "ratio_disagree", provisional = d, impact from the a-d distance
    (``dist_ad``); the vision check chooses a, d or their weighted mean (a and mean need gates_overridden "a.ratio")."""
    dist = float(np.linalg.norm(P["a"] - P["d"]))
    return dict(base, pos=P["d"], decision=f"flagged: source a failed only the segment-ratio gate{drop_txt}; a and UniRig (d) "
                f"{dist / H:.2%} H apart (tau {tau / H:.2%} H); provisional = d; counted tile (ratio_disagree): the vision check "
                "chooses a, d or their mean (a and mean need gates_overridden \"a.ratio\")", confidence=conf * 0.5, flagged=True,
                flag="vision", kind="ratio_disagree", provisional="d", dist_ad=dist)


def _boot_ankle_result(base: dict, c: dict, P: dict, tau: float, H: float, conf: float, drop_txt: str) -> dict:
    """Boot ankle (joint-placement.md interim rules): source a's instep-crease ankle is accepted only when UniRig (sanity only, never
    fused) agrees within tau; otherwise, or without UniRig, the vision check decides (provisional = a). Source a's ``interim_note``
    (e.g. "foot junction below a soft flare") goes into the decision text."""
    rule = "boot ankle (interim rule" + (f", {c['a']['interim_note']})" if c["a"].get("interim_note") else ")")
    if "d" not in c:
        return dict(base, pos=P["a"], decision=f"{rule} without UniRig to compare{drop_txt}: the vision check decides",
                    confidence=conf * 0.5, flagged=True, flag="vision", kind="boot_ankle", provisional="a")
    dd = float(np.linalg.norm(P["a"] - np.asarray(c["d"]["pos"], dtype=np.float64)))
    if dd <= tau:
        return dict(base, pos=P["a"], decision=f"{rule}: a agrees with UniRig (sanity) within tau ({dd / H:.2%} H <= "
                    f"{tau / H:.2%} H): accepted{drop_txt}", confidence=conf, flagged=False, flag=None, kind="single")
    return dict(base, pos=P["a"], decision=f"{rule}: a and UniRig differ by {dd / H:.2%} H > tau {tau / H:.2%} H"
                f"{drop_txt}; provisional = a; the vision check decides", confidence=conf * 0.5, flagged=True, flag="vision",
                kind="boot_ankle", provisional="a")


# --------------------------------------------------------------------------------------------------------------------------
# vision decisions
# --------------------------------------------------------------------------------------------------------------------------


def _is_sha(x) -> bool:
    return isinstance(x, str) and bool(_SHA256.match(x))


def validate_vision_record(rec) -> list[str]:
    """Problems of one vision_decisions.json record (module docstring); an empty list = a complete record."""
    if not isinstance(rec, dict):
        return ["the record is not an object"]
    errs = []
    if rec.get("choice") not in VISION_CHOICES:
        errs.append(f"choice {rec.get('choice')!r} not in {list(VISION_CHOICES)}")
    if not (isinstance(rec.get("reason"), str) and rec["reason"].strip()):
        errs.append("reason missing")
    ev = rec.get("evidence")
    if not (isinstance(ev, list) and ev):
        errs.append("evidence missing (a list of {path, view, sha256})")
    else:
        for i, x in enumerate(ev):
            if not isinstance(x, dict):
                errs.append(f"evidence[{i}] is not an object")
                continue
            if not (isinstance(x.get("path"), str) and x["path"]):
                errs.append(f"evidence[{i}].path missing")
            v = x.get("view", x.get("views"))
            if not ((isinstance(v, str) and v) or (isinstance(v, list) and v and all(isinstance(q, str) and q for q in v))):
                errs.append(f"evidence[{i}].view missing")
            if not _is_sha(x.get("sha256")):
                errs.append(f"evidence[{i}].sha256 missing or not a sha256")
    inp = rec.get("inputs")
    if not isinstance(inp, dict):
        errs.append("inputs missing ({landmarks_a, landmarks_d, mesh, chosen_pos})")
    else:
        for k in ("landmarks_a", "mesh"):
            if not _is_sha(inp.get(k)):
                errs.append(f"inputs.{k} missing or not a sha256")
        if "landmarks_d" not in inp or not (inp["landmarks_d"] is None or _is_sha(inp["landmarks_d"])):
            errs.append("inputs.landmarks_d missing (a sha256, or null without UniRig)")
        cp = inp.get("chosen_pos")
        if not schema.is_vec3(cp):
            errs.append("inputs.chosen_pos missing (three finite numbers)")
    go = rec.get("gates_overridden")
    if not (isinstance(go, list) and all(isinstance(q, str) for q in go)):
        errs.append("gates_overridden missing (a list of gate names, may be empty)")
    rv = rec.get("reviewer")
    if not isinstance(rv, dict):
        errs.append("reviewer missing ({model, date, confidence})")
    else:
        if not (isinstance(rv.get("model"), str) and rv["model"].strip()):
            errs.append("reviewer.model missing")
        if not (isinstance(rv.get("date"), str) and _DATE.match(rv["date"])):
            errs.append("reviewer.date missing (YYYY-MM-DD)")
        cf = rv.get("confidence")
        if not (schema.is_num(cf) and 0.0 <= float(cf) <= 1.0):
            errs.append("reviewer.confidence missing (a number in 0..1)")
    return errs


def _mean_sources(f: dict) -> list:
    """Sources averaged by the "mean" choice: the plausible ones; a and d for a ratio_disagree landmark (review r3 F1)."""
    if f.get("auto_kind", f["kind"]) == "ratio_disagree":
        return ["a", "d"]
    return list(f["plausible"])


def _choices(f: dict) -> dict:
    """Position a decision record carries in ``inputs.chosen_pos`` per choice (the fused candidates, the weighted mean of
    ``_mean_sources``, the provisional position for escalate)."""
    out = {s: [float(v) for v in p] for s, p in f["cand_pos"].items()}
    pl = _mean_sources(f)
    if len(pl) >= 2:
        Pp = np.array([f["cand_pos"][s] for s in pl])
        wp = np.array([max(f["weights"][s], 1e-6) for s in pl])
        out["mean"] = [float(v) for v in (Pp * wp[:, None]).sum(0) / wp.sum()]
    out["escalate"] = [float(v) for v in f["auto_pos"]]
    return out


def _required_overrides(f: dict) -> dict:
    """``gates_overridden`` names a decision record needs per choice, as "<source>.<gate>": the failed gates of the chosen source
    (+ "d.sanity" for a sanity-only UniRig position), of both sources for "mean" ("a.ratio" on ratio_disagree), none to escalate."""
    def failed(s):
        return [f"{s}.{g}" for g in f["gates_failed"].get(s, [])] + (["d.sanity"] if s == "d" and f["is_sanity"] else [])

    out = {s: failed(s) for s in f["cand_pos"]}
    pl = _mean_sources(f)
    if len(pl) >= 2:
        out["mean"] = [g for s in pl for g in failed(s)]
    out["escalate"] = []
    return out


def _check_vision(lid: str, f: dict, rec: dict, H: float, cfg: Config, input_sha256: dict) -> tuple[str, dict]:
    """(status, detail) of one record: "rejected" (incomplete, impossible choice or unacknowledged failed gates), "stale" (chosen
    position moved > stale_tau_frac x tau), "escalated" or "applied" (detail ``pos``)."""
    errs = validate_vision_record(rec)
    if errs:
        return "rejected", {"errors": errs}
    ch = rec["choice"]
    choices = _choices(f)
    if ch not in choices:
        why = ("mean needs at least two plausible sources (or a ratio_disagree landmark)" if ch == "mean" else
               f"source {ch} has no candidate for {lid}")
        return "rejected", {"errors": [why]}
    # failed gates of the chosen source(s), as "<source>.<gate>"; a bare gate name counts for each of them
    srcs = _mean_sources(f) if ch == "mean" else ([ch] if ch in POSITION_SOURCES else [])
    ack = set()
    for q in rec["gates_overridden"]:
        head, _, tail = q.partition(".")
        ack |= {q} if tail and head in POSITION_SOURCES else {f"{s}.{q}" for s in srcs}
    missing = [g for g in _required_overrides(f).get(ch, []) if g not in ack]
    if missing:
        return "rejected", {"errors": [f"gates_overridden does not list the failed gates of {ch}: {missing}"]}
    now = np.asarray(choices[ch], dtype=np.float64)
    drift = float(np.linalg.norm(now - np.asarray(rec["inputs"]["chosen_pos"], dtype=np.float64)))
    changed = [k for k in ("landmarks_a", "landmarks_d", "mesh") if k in input_sha256 and rec["inputs"].get(k) != input_sha256[k]]
    rv = rec["reviewer"]
    det = {"choice": ch, "reason": rec["reason"], "drift_m": round(drift, 6), "drift_tau": round(drift / f["tau"], 3),
           "inputs_changed": changed, "reviewer": {"model": rv["model"], "date": rv["date"], "confidence": float(rv["confidence"])},
           "gates_overridden": list(rec["gates_overridden"])}
    if drift > cfg.stale_tau_frac * f["tau"]:
        return "stale", det
    if ch == "escalate":
        return "escalated", det
    det["pos"] = [float(v) for v in now]
    return "applied", det


def _apply_vision(fused: dict, vision: dict, H: float, cfg: Config, input_sha256: dict, spine_group: bool) -> dict:
    """Apply the vision decision records to the flagged landmarks (module docstring). Returns the report's ``vision`` part."""
    rep: dict = {"applied": [], "escalated": [], "stale": {}, "rejected": {}, "unused": {}}
    for f in fused.values():
        if f["auto_flagged"]:
            f["vision"] = {"status": "user override"} if f["kind"] == "override" else {"status": "pending"}
    for lid, rec in vision.items():
        f = fused.get(lid)
        if f is None:
            rep["unused"][lid] = "no such landmark"
        elif f["kind"] == "override":
            rep["unused"][lid] = "user override (final)"
        elif not f["auto_flagged"]:
            rep["unused"][lid] = "landmark not flagged"
        elif spine_group and lid in SPINE_GROUP[1:]:
            rep["unused"][lid] = "spine tile: spine_01/02 follow the placed pelvis"
        else:
            status, det = _check_vision(lid, f, rec, H, cfg, input_sha256)
            f["vision"] = dict(status=status, **det)
            note = f"; inputs changed since the decision: {', '.join(det['inputs_changed'])}" if det.get("inputs_changed") else ""
            if status == "rejected":
                rep["rejected"][lid] = det["errors"]
                f["decision"] += "; vision decision rejected (" + "; ".join(det["errors"]) + ")"
            elif status == "stale":
                rep["stale"][lid] = {k: det[k] for k in ("choice", "drift_m", "drift_tau")}
                f.update(flagged=True, flag="stale_vision_decision")
                f["decision"] += (f"; vision decision ({det['choice']}) stale: its position moved {det['drift_tau']:.2f} tau > "
                                  f"{cfg.stale_tau_frac} tau since{note}")
            elif status == "escalated":
                rep["escalated"].append(lid)
                f.update(flagged=True, flag="escalated")
                f["decision"] += f"; vision check ({det['reviewer']['model']}, {det['reviewer']['date']}): escalate - {det['reason']}{note}"
            else:
                rep["applied"].append(lid)
                f.update(pos=np.asarray(det["pos"], dtype=np.float64), flagged=False, flag=None, kind="vision",
                         confidence=float(min(cfg.vision_conf_max, det["reviewer"]["confidence"])))
                f["decision"] += (f"; vision check ({det['reviewer']['model']}, {det['reviewer']['date']}): {det['choice']} - "
                                  f"{det['reason']}{note}")
    return rep


def _derive_spine(fused: dict, frame: dict | None, cfg: Config, H: float) -> None:
    """Spine tile: once the pelvis is placed (vision or override) and the chest is not flagged, spine_01/02 sit at 1/3 and 2/3 of the
    straight pelvis -> chest line (``spine_chord_point``, review r3 F2), unless the user overrides them. While the chest is flagged
    (review r3 F5) they wait for it: they stay flagged - "escalated" with an escalated chest (they go to the user with it), else
    pending - with vision status "waiting for the chest"."""
    pel, chest = fused.get("pelvis"), fused.get("chest")
    if pel is None or chest is None or pel["flagged"]:
        return
    todo = [(lid, frac) for lid, frac in (("spine_01", 1 / 3), ("spine_02", 2 / 3)) if lid in fused and fused[lid]["kind"] != "override"]
    if chest["flagged"]:
        for lid, _ in todo:
            f = fused[lid]
            if chest["flag"] == "escalated":
                f.update(flagged=True, flag="escalated")
            f["vision"] = {"status": "waiting for the chest", "chest_flag": chest["flag"]}
            f["decision"] += (f"; pelvis placed ({pel['kind']}), re-derivation waits for the chest (flagged {chest['flag']}): "
                              "the straight pelvis -> chest line needs a placed chest")
        return
    line = (frame or {}).get("spine_line")
    for lid, frac in todo:
        f = fused[lid]
        p = spine_chord_point(pel["pos"], chest["pos"], frac)
        off = _spine_line_offset(line, p)
        f.update(pos=p, flagged=False, flag=None, kind="derived", confidence=float(min(pel["confidence"], cfg.single_conf_max)),
                 decision=f"derived: {frac:.2f} of the straight line from the placed pelvis ({pel['kind']}) to the chest ({chest['kind']}) "
                          f"(spine tile; source a's spine line, which follows coats and belts, "
                          + (f"runs {off * 1000:.1f} mm ({off / H:.2%} H) from it" if off is not None else "is not available here")
                          + f"); automatic: {f['auto_decision']}")
        f["vision"] = {"status": "derived from the pelvis"}


# --------------------------------------------------------------------------------------------------------------------------
# flag sheet
# --------------------------------------------------------------------------------------------------------------------------


def _status(f: dict) -> str:
    if not f["flagged"]:
        return "resolved"
    return "escalated" if f["flag"] == "escalated" else "pending"


def _crop(P: np.ndarray, tau: float, H: float) -> dict:
    half = max(3 * tau, 0.6 * float(np.ptp(P, axis=0).max()) if len(P) > 1 else 0.0, 0.02 * H)
    c = P.mean(0)
    return {"centre": [float(v) for v in c], "half_size": float(half), "box_min": [float(v) for v in c - half],
            "box_max": [float(v) for v in c + half]}


def _jsonable(x):
    if isinstance(x, dict):
        return {str(k): _jsonable(v) for k, v in x.items()}
    if isinstance(x, (list, tuple)):
        return [_jsonable(v) for v in x]
    if isinstance(x, np.ndarray):
        return _jsonable(x.tolist())
    if isinstance(x, (np.floating, np.integer, np.bool_)):
        return x.item()
    return x


def flag_report(fused: dict, H: float, cfg: Config, gg: GateGeometry | None = None, spine_group: bool = False,
                vrep: dict | None = None) -> dict:
    """Flag-sheet data (module docstring): tiles of the automatically flagged landmarks (L/R pairs and the spine group together)
    ordered by impact, with status after the vision decisions, crops and section polylines; ``ready_for_user`` and lists."""
    tiles: dict = {}
    for lid, f in fused.items():
        if not f.get("auto_flagged"):
            continue
        key = "spine" if spine_group and base_id(lid) in SPINE_GROUP else base_id(lid)
        t = tiles.setdefault(key, {"key": key, "ids": [], "class": f["class"], "impact": 0.0, "tau_H": 0.0, "flags": [],
                                   "reasons": {}, "status_by_id": {}, "candidates": {}, "sanity_only": {}, "provisional": {},
                                   "provisional_source": {}, "gates_failed": {}, "choices": {}, "required_overrides": {},
                                   "vision": {}, "crops": {}, "sections": {}})
        t["ids"].append(lid)
        t["flags"].append(f["auto_flag"])
        dist = f["dist_ad"] if f["auto_kind"] == "ratio_disagree" else f["spread"]
        sev = 3.0 if f["auto_kind"] == "no_plausible" else min(3.0, dist / max(f["tau"], 1e-12))
        t["impact"] = max(t["impact"], IMPACT[f["class"]] * max(sev, 1.0))
        t["tau_H"] = max(t["tau_H"], f["tau_H"])
        t["reasons"][lid] = f["decision"]
        t["status_by_id"][lid] = _status(f)
        t["candidates"][lid] = {s: [float(v) for v in p] for s, p in f["cand_pos"].items()}
        t["sanity_only"][lid] = bool(f["is_sanity"])
        t["provisional"][lid] = [float(v) for v in f["pos"]]
        t["provisional_source"][lid] = f.get("provisional") or f["kind"]
        t["gates_failed"][lid] = {s: g for s, g in f["gates_failed"].items() if g}
        t["choices"][lid] = _choices(f)
        t["required_overrides"][lid] = _required_overrides(f)
        t["vision"][lid] = _jsonable(f.get("vision", {"status": "pending"}))
        P = np.array(list(f["cand_pos"].values()) + [list(f["pos"])])
        t["crops"][lid] = _crop(P, f["tau"], H)
        if gg is not None:
            nrm, kind = gg.section_plane(lid, f["pos"], fused)
            t["sections"][lid] = {"kind": kind, "plane": {"origin": [float(v) for v in f["pos"]], "normal": [float(v) for v in nrm]},
                                  "polylines": gg.section_polylines(f["pos"], nrm, t["crops"][lid]["box_min"],
                                                                    t["crops"][lid]["box_max"])}
    out = []
    for t in sorted(tiles.values(), key=lambda t: (-t["impact"], t["key"])):
        t["ids"].sort()
        t["flag"] = "vision_only" if all(fl == "vision_only" for fl in t.pop("flags")) else "vision"
        st = list(t["status_by_id"].values())
        if t["key"] == "spine":  # the pelvis decides; once it is placed, spine_01/02 may still wait for the chest (review r3 F5)
            st = [t["status_by_id"]["pelvis"]]
            if st[0] == "resolved":
                st += [v for k, v in t["status_by_id"].items() if k != "pelvis"]
        t["status"] = "pending" if "pending" in st else ("escalated" if "escalated" in st else "resolved")
        P = np.array([p for lid in t["ids"] for p in list(t["candidates"][lid].values()) + [t["provisional"][lid]]])
        t["crop"] = dict(_crop(P, t["tau_H"] * H, H), views=["front", "side", "top"],
                         markers="one per source (a green, b orange, d blue, provisional red) + the section polylines")
        t["grid_m"] = 0.01 * H
        out.append(t)
    for i, t in enumerate(out):
        t["tile"] = i + 1
        t["impact"] = round(t["impact"], 3)
    n_tiles = sum(1 for t in out if t["flag"] == "vision")
    pending = [t for t in out if t["status"] == "pending"]
    escalated = [t for t in out if t["status"] == "escalated"]
    reasons, notes = [], []
    if pending:
        reasons.append(f"vision check pending on {len(pending)} tile(s): "
                       + ", ".join(t["key"] + (" (vision-only)" if t["flag"] == "vision_only" else "") for t in pending)
                       + "; ready_for_user is evaluated after the vision decisions")
    if len(escalated) > cfg.max_tiles:
        reasons.append(f"{len(escalated)} escalated tiles > {cfg.max_tiles}: not ready for the user; fix the detectors "
                       f"({', '.join(t['key'] for t in escalated)})")
    if n_tiles > cfg.max_tiles:
        notes.append(f"{n_tiles} tiles before the vision check > {cfg.max_tiles}: the detectors need work unless the vision check "
                     "resolves most of them")
    flagged = [lid for lid, f in fused.items() if f["flagged"]]
    spreads = [f["spread_H"] for f in fused.values() if f["auto_kind"] in ("agree", "majority", "disagree")]
    kinds = [f["kind"] for f in fused.values()]
    summary = {"n_landmarks": len(fused), "n_flagged": len(flagged), "n_auto_flagged": sum(1 for f in fused.values() if f["auto_flagged"]),
               "n_tiles": n_tiles, "n_vision_only_tiles": len(out) - n_tiles, "n_pending": len(pending), "n_escalated": len(escalated),
               "n_agree": kinds.count("agree"), "n_majority": kinds.count("majority"), "n_single": kinds.count("single"),
               "n_vision_only": sum(1 for f in fused.values() if f["auto_flag"] == "vision_only"),
               "n_ratio_disagree": sum(1 for f in fused.values() if f["auto_kind"] == "ratio_disagree"),
               "n_no_plausible": kinds.count("no_plausible"), "n_disagree": kinds.count("disagree"),
               "n_boot_ankle": sum(1 for f in fused.values() if "boot ankle" in f["auto_decision"]),
               "n_vision": kinds.count("vision"), "n_derived": kinds.count("derived"), "n_override": kinds.count("override"),
               "spread_H_median": float(np.median(spreads)) if spreads else None}
    return {"ready_for_user": not pending and len(escalated) <= cfg.max_tiles, "reasons": reasons, "notes": notes,
            "max_tiles": cfg.max_tiles, "n_tiles": n_tiles, "n_vision_only_tiles": len(out) - n_tiles, "n_pending": len(pending),
            "n_escalated": len(escalated), "n_resolved": sum(1 for t in out if t["status"] == "resolved"),
            "user_tiles": [t["key"] for t in escalated], "tiles": _jsonable(out),
            "flags": [{"id": lid, "kind": fused[lid]["kind"], "flag": fused[lid]["flag"], "decision": fused[lid]["decision"]}
                      for lid in flagged],
            "vision": _jsonable(vrep or {}),
            "single_source": [{"id": lid, "source": f["plausible"][0], "pos": [float(v) for v in f["pos"]], "flag": f["flag"]}
                              for lid, f in fused.items() if f["kind"] == "single"],
            "prior_fail": [{"id": lid, "source": s, "gate": g["prior"]} for lid, f in fused.items() for s, g in f["gates"].items()
                           if str(g.get("prior", "")).startswith("fail")],
            "summary": summary, "config": cfg.to_json()}


# --------------------------------------------------------------------------------------------------------------------------
# files
# --------------------------------------------------------------------------------------------------------------------------


def write(fused: dict, report: dict, out_dir, asset_id: str, family_name: str, H: float) -> tuple[str, str]:
    """landmarks.json (contract format, validated; per landmark also ``gates``, ``tau``, ``class``, ``kind``, ``flag``,
    ``auto_flagged``, ``vision``) + flags.json."""
    os.makedirs(out_dir, exist_ok=True)
    details = {}
    for k, f in fused.items():
        details[k] = {"sources": f["sources"], "spread": round(float(f["spread"]), 6), "decision": f["decision"],
                      "confidence": round(float(f["confidence"]), 3), "flagged": bool(f["flagged"]), "flag": f["flag"],
                      "auto_flagged": bool(f["auto_flagged"]), "gates": f["gates"], "tau": round(float(f["tau"]), 6),
                      "class": f["class"], "kind": f["kind"]}
        if "vision" in f:
            details[k]["vision"] = _jsonable(f["vision"])
    lp = rlm.save_landmarks(os.path.join(out_dir, "landmarks.json"), asset_id, family_name, H, {k: f["pos"] for k, f in fused.items()},
                            details)
    doc = {"schema": SCHEMA, "asset_id": asset_id, "family": family_name, "H": H, **report}
    fp = npzio.write_json(os.path.join(out_dir, "flags.json"), doc)
    return lp, fp


def run(asset_id: str, family_name: str, a=None, d=None, b=None, override=None, out_dir=None, cfg: Config | None = None, mesh=None,
        vision=None) -> dict:
    """Load the source files (+ mesh.npz for the geometric gates and the tile sections), fuse, write landmarks.json + flags.json.
    Missing optional files are skipped. Returns a summary."""
    a = a or os.path.join(SCRATCH, asset_id, "landmarks_a.json")
    out_dir = out_dir or os.path.dirname(os.path.abspath(a))
    d = os.path.join(SCRATCH, "unirig", asset_id, "landmarks_d.json") if d is None else d  # "" = no UniRig source
    override = override or os.path.join(out_dir, "landmarks_override.json")
    vision = vision or os.path.join(out_dir, "vision_decisions.json")
    mesh = mesh or os.path.join(os.path.dirname(os.path.abspath(a)), "mesh.npz")
    sources, used, frame = {}, {}, {}
    for key, path in (("a", a), ("b", b), ("d", d)):
        if path and os.path.isfile(path):
            sources[key], fr = load_source(path)
            if key == "a":
                frame = fr
            used[key] = os.path.abspath(path)
    if not sources:
        raise FileNotFoundError(f"no landmark source found for {asset_id} (a={a}, d={d})")
    H = next(float(npzio.read_json(p)["H"]) for p in used.values() if "H" in npzio.read_json(p))
    ov = rlm.load_landmarks(override) if override and os.path.isfile(override) else None
    if ov:
        used["e"] = os.path.abspath(override)
    vis = load_vision(vision) if vision and os.path.isfile(vision) else None
    if vis is not None:
        used["vision"] = os.path.abspath(vision)
    gg = None
    if mesh and os.path.isfile(mesh):
        gg = GateGeometry(npzio.load_mesh(mesh), frame)
        used["mesh"] = os.path.abspath(mesh)
    sha = {"landmarks_a": file_sha256(used.get("a")), "landmarks_d": file_sha256(used.get("d")), "mesh": file_sha256(used.get("mesh"))}
    fam = template.load_family(family_name)
    fused, report = fuse(sources, H, fam, cfg, gg, ov, vis, frame, sha)
    report["inputs"] = used
    report["inputs_sha256"] = sha
    report["vision"]["file"] = used.get("vision")
    lp, fp = write(fused, report, out_dir, asset_id, family_name, H)
    return {"landmarks": lp, "flags": fp, "ready_for_user": report["ready_for_user"], **report["summary"],
            "tiles": [t["key"] for t in report["tiles"]], "user_tiles": report["user_tiles"], "inputs": used}


def main(argv=None) -> int:
    import argparse

    ap = argparse.ArgumentParser(description="Fuse landmark sources -> landmarks.json + flags.json (plausibility gates, tau, flag tiles)")
    ap.add_argument("--asset-id", required=True)
    ap.add_argument("--family", default="H")
    ap.add_argument("--a", default=None, help="source a (geometry) landmarks_a.json")
    ap.add_argument("--d", default=None, help="source d (UniRig) landmarks_d.json")
    ap.add_argument("--b", default=None, help="source b (proxy) file, optional")
    ap.add_argument("--mesh", default=None, help="mesh.npz for the geometric gates and the tile sections (default: next to source a)")
    ap.add_argument("--override", default=None, help="landmarks_override.json (source e)")
    ap.add_argument("--vision", default=None, help="vision_decisions.json (Opus ortho-crop check; full records, see the module docstring)")
    ap.add_argument("--out-dir", default=None)
    ap.add_argument("--sanity-only", default=None, help="comma list of base ids where UniRig is sanity-only "
                                                        "(default pelvis,spine_01,spine_02,hip,ankle,clavicle)")
    ap.add_argument("--unirig-bias", default=None, help="JSON {base id: {bias_H: [bx, by, bz], weight: w}} (P5 calibration)")
    ap.add_argument("--max-tiles", type=int, default=6)
    a = ap.parse_args(argv)
    cfg = Config(max_tiles=a.max_tiles)
    if a.sanity_only is not None:
        cfg.sanity_only = tuple(x.strip() for x in a.sanity_only.split(",") if x.strip())
    if a.unirig_bias:
        cfg.unirig_bias = npzio.read_json(a.unirig_bias)
    res = run(a.asset_id, a.family, a.a, a.d, a.b, a.override, a.out_dir, cfg, a.mesh, a.vision)
    print(json.dumps(res, default=schema.json_default))
    return 0


if __name__ == "__main__":
    sys.exit(main())
