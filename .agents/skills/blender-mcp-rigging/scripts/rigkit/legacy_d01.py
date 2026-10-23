r"""rigkit.legacy_d01 - D01-only pose specs for rigkit.poses (pure Python; Blender and rigkit-env). Nothing here is used for another
asset; the matching D01 measurements live in solvers/legacy_d01.py.

The 17 QA poses are the Actions ``QA_pose_<name>`` of ``ashlar/3d/monsters/D01_hodling/rig/qa/D01_hodling_qa_poses.blend`` (D01
``d01_poses.py``); ``rigkit.poses`` appends them into the rig file inside its emulation context and assigns each to the control
armature at frame 1. Tags follow D01 qa_report §4: FK leg poses lift a foot, so they are not contact-checked.
"""
from __future__ import annotations

ACTION_PREFIX = "QA_pose_"
POSE_ORDER = ("rest", "hands_raised", "hands_crossed", "arms_down_fk", "arms_forward_fk", "elbows_max_fk", "squat", "long_step",
              "twist_p45", "twist_m45", "head_down", "head_up", "head_turn", "hip_flex_fk", "hip_flex_fk_loin", "hip_abduct_fk",
              "aux_motion")
FEET_FREE = ("hip_flex_fk", "hip_flex_fk_loin", "hip_abduct_fk")


def specs() -> list:
    """The 17 D01 QA poses as Action specs (tags from qa_report §4)."""
    out = []
    for nm in POSE_ORDER:
        tags = ["legacy", "rest" if nm == "rest" else "extreme"]
        if nm not in FEET_FREE:
            tags += ["planted_L", "planted_R"]
        out.append({"name": nm, "kind": "action", "ik": "default", "ops": [{"op": "action", "action": ACTION_PREFIX + nm}],
                    "tags": tags})
    return out
