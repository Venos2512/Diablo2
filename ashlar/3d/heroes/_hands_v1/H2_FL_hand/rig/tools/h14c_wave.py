"""H2_FL_hand rig: contact-limited wave frames (rigkit-env). For wave_k the whole frame's curls are scaled by k, bisected to the largest k with
every finger's palm intrusion <= 1 mm and side contact <= 1 mm; writes the scaled curls back into rig_recipe.json rom.poses.
Usage: python -I -B h14c_wave.py <rig_dir> <weights_tag>"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
_src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'h14_pose_tune.py'), encoding='utf-8').read().split("base = json.loads")[0]
sys.argv = [sys.argv[0], sys.argv[1], sys.argv[2], 'wave_1', '1.0', '1.0']
exec(_src)
R = json.load(open(os.path.join(rig, 'rig_recipe.json')))
res = {}
for w in [k for k in R['rom']['poses'] if k.startswith('wave_')]:
    base = R['rom']['poses'][w]['curl']
    def ok(k):
        Pw = positions({'curl': {f: [x * k for x in c] for f, c in base.items()}})
        return all(max(depth2(f, Pw)) <= LIM for f in base)
    if ok(1.0):
        k = 1.0
    else:
        lo, hi = 0.0, 1.0
        for _ in range(9):
            mid = (lo + hi) / 2
            lo, hi = (mid, hi) if ok(mid) else (lo, mid)
        k = lo
    R['rom']['poses'][w]['curl'] = {f: [round(x * k, 1) for x in c] for f, c in base.items()}
    res[w] = round(k, 3)
R['rom']['wave_note'] = 'wave frames scaled to contact (tools/h14c_wave.py): ' + json.dumps(res)
json.dump(R, open(os.path.join(rig, 'rig_recipe.json'), 'w'), indent=1)
print('H14C', res)
