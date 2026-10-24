import json
import sys

d = json.load(open(sys.argv[1]))
print("skin/mesh untouched vs G2:", d.get("mesh_skin_untouched_vs_g2"), d["mesh_counts"]["scene"], d["mesh_counts"]["actions"])
for k, c in d["clips"].items():
    print("==", k, c["ownership"]["slot"], c["ownership"]["frame_range"], "n", c["sample_count"], "dur", c["duration_s"], "keys", c["keys"]["keys_total"])
    s = c["seam"]
    print(" seam: vert %.3f mm, rot %.3f deg (%s), loop=%s" % (s["max_vertex_diff_mm_first_vs_last"], s["max_bone_rot_diff_deg"], s["worst_bone"], s["loop"]))
    print(" root range", [round(x, 4) for x in c["root_displacement"]["ctl_root_range_m"]], "| floor min z mm", round(c["floor"]["mesh_min_z_mm_min"], 2), "sink frames", c["floor"]["frames_below_-1mm"])
    for sd in "LR":
        f = c["foot"][sd]
        print("  foot", sd, "touchdown", f["touchdown_frames"], "contact#", len(f["contact_frames"]), "contact minz", f["contact_minz_mm_range"] and [round(x, 2) for x in f["contact_minz_mm_range"]],
              "jitter %.2f" % f["max_stance_jitter_mm_per_frame"], [(r["frames"], round(r["total_travel_mm"], 1), round(r["mean_step_mm_per_frame"], 2)) for r in f["runs"]])
    if "locomotion" in c:
        print(" loco", {a: (round(b, 4) if isinstance(b, float) else b) for a, b in c["locomotion"].items()})
    if "planted_feet" in c:
        print(" planted", c["planted_feet"])
    if "attack" in c:
        print(" attack", {a: b for a, b in c["attack"].items() if a != "reach_m_by_frame"})
    if "loincloth" in c:
        print(" loincloth", c["loincloth"]["worst"], len(c["loincloth"]["frames_tested"]), "frames")
