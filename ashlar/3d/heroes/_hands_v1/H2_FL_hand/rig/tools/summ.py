"""Compact table of rig/_work/metrics_*.json (python -I -B summ.py <rig_dir> file1 file2 ...)."""
import json, os, sys
STD = ['lab_relaxed', 'lab_open', 'cup', 'loose_grip', 'spread', 'wave_1', 'wave_2', 'wave_3', 'wave_4', 'wrist_flex40', 'wrist_ext40', 'pron90', 'sup90', 'open_sup90']
EXT = ['fist', 'lab_grip', 'point', 'fist_wrist_flex40']
FR = ['thumb', 'index', 'middle', 'ring', 'pinky', 'palm', 'cuff_forearm']
rig = sys.argv[1]
for fn in sys.argv[2:]:
    m = json.load(open(os.path.join(rig, '_work', fn)))
    P = m['poses']
    def tot(names, rg=None):
        return sum(P[n]['regions'][r]['torn'] for n in names if n in P for r in P[n]['regions'] if (rg is None or r == rg))
    vol = min((v, n, j) for n in P for j, v in P[n]['joint_volume'].items())
    volstd = min((v, n, j) for n in P if n in STD for j, v in P[n]['joint_volume'].items()) if any(n in P for n in STD) else None
    area = max(((P[n]['regions'][r]['area_frac'] or 0), n, r) for n in P if n in STD for r in P[n]['regions'] if r != 'rigid') if any(n in P for n in STD) else None
    pen = {n: max((v.get('max_depth_mm', 0) for v in P[n]['penetration'].values()), default=0) for n in P if P[n]['penetration']}
    print(f"{fn:34s} torn std {tot(STD):4d} ext {tot(EXT):4d} | by region std " + ' '.join(f"{r[:3]}{tot(STD, r)}" for r in FR) +
          f" | vol min {vol[0]:.3f} ({vol[1]}/{vol[2]}) std {volstd[0] if volstd else '-'} | area std max {area[0]:.3f} ({area[1]}/{area[2]}) | pen max " +
          ' '.join(f"{k}:{v:.1f}" for k, v in pen.items() if v > 0.5))
