"""H2_FL_hand rig: the thumb of the fist (rigkit-env). The contact limit stops the thumb's plain curl at 1 mm against the index, so the fist
thumb sticks out. Grid search over thumb_01 flexion (X) and its swing about the palm normal (local Z: opposition across the palm), and
thumb_02 / thumb_03 flexion, with the four fingers at the tuned fist: minimise the distance from the thumb pad (thumb_03 tail) to the
middle of index_02 / middle_02 (where a fist thumb rests), subject to thumb intrusion <= 1 mm into anything, inside anatomical limits (thumb MCP total <= 65 deg, IP total <= 80 deg with the rest curl 17 / 22).
Writes rig/_work/tuned_fist_thumb.json. Usage: python -I -B h15_thumb_fist.py <rig_dir> <weights_tag>
"""
import itertools, json, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
_src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'h14_pose_tune.py'), encoding='utf-8').read().split("base = json.loads")[0]
sys.argv = [sys.argv[0], sys.argv[1], sys.argv[2], 'fist', '1.0', '1.0']
exec(_src)
fist = {n[:-3]: [] for n in fk.R['skeleton']['fist_deg']}
for n, d_ in fk.R['skeleton']['fist_deg'].items():
    fist[n[:-3]].append(d_[0])
best = None
rows = []
for t1x, t1z, t2, t3 in itertools.product([0, 10, 20, 30, 40], [-60, -50, -40, -30, -20, -10, 0], [10, 20, 30, 40, 48], [10, 25, 40, 50, 58]):
    spec = {'curl': {f: fist[f] for f in ['index', 'middle', 'ring', 'pinky']}, 'bones': {}}
    spec['curl']['thumb'] = [t1x, t2, t3]
    spec['bones']['thumb_01'] = [0, 0, t1z]
    M = fk.pose(spec)
    pad = M['thumb_03'][:3, :3] @ np.array([0, np.linalg.norm(np.array(fk.bones['thumb_03']['tail']) - np.array(fk.bones['thumb_03']['head'])), 0]) + M['thumb_03'][:3, 3]
    tg = 0.5 * ((M['index_02'][:3, 3] + M['index_03'][:3, 3]) / 2 + (M['middle_02'][:3, 3] + M['middle_03'][:3, 3]) / 2)
    dist = float(np.linalg.norm(pad - tg))
    if best is not None and dist >= best[0]:
        continue
    Pw = topo.gather(h_fk.lbs(d['V'], wz['W'], WB, fk.mats(spec, bn), rest, bn), how='first')
    dp, dn = depth2('thumb', Pw)
    others = max(max(depth2(f, Pw)) for f in ['index', 'middle'])
    rows.append((t1x, t1z, t2, t3, round(dist * 1000, 1), round(max(dp, dn) * 1000, 2)))
    if max(dp, dn) <= LIM and others <= 0.006:
        best = (dist, t1x, t1z, t2, t3, dp, dn)
print('H15 best', best)
out = dict(t1x=best[1], t1z=best[2], t2=best[3], t3=best[4], pad_to_target_mm=round(best[0] * 1000, 1), palm_mm=round(best[5] * 1000, 2), side_mm=round(best[6] * 1000, 2))
hc.save_json(os.path.join(rig, '_work', 'tuned_fist_thumb.json'), out)
print('H15 ' + json.dumps(out))
