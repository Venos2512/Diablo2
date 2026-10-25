"""H2_FL_hand rig: contact-limited grip, joint version of h14_pose_tune (rigkit-env). The four fingers curl TOGETHER with one scale k on the
added PIP/DIP curl (MCP kept), bisected to the largest k where every finger has palm intrusion <= limit and side contact with its
neighbours <= max(the contact that the MCP flexion alone already makes + 1 mm, SIDE_CAP = 5 mm) (thick stylized fingers press together; LBS cannot squash them).
Then each finger is raised alone as far as the same rule allows, then the thumb (palm and side <= limit).
Usage: python -I -B h14b_fist_joint.py <rig_dir> <weights_tag> <pose> [limit_mm=1.0]
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
_src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'h14_pose_tune.py'), encoding='utf-8').read().split("solved = []")[0]
sys.argv = sys.argv[:4] + [sys.argv[4] if len(sys.argv) > 4 else '1.0', '1.0']
exec(_src)
LONG = ['index', 'middle', 'ring', 'pinky']
SIDE_CAP = float(os.environ.get('H14_SIDE_CAP_MM', '5.0')) / 1000  # pressed neighbours may overlap this much (LBS cannot squash soft tissue)
solved = list(FING)


LABMODE = 'lab' in spec  # tune the lab's own grip (FINGER_POSES, lab-derived axes): every segment of a finger scales with k
if LABMODE:
    LP = fk.R['rom']['lab_finger_poses']
    offer, grip = spec['lab']
    lerp = lambda a, b, t: a + (b - a) * t  # noqa: E731
    target = {f: [lerp(lerp(LP[f]['relaxed'][k], LP[f]['open'][k], offer), LP[f]['grip'][k], grip) for k in range(3)] for f in FING}
    lab_sp = {f: lerp(lerp(LP[f]['spread']['relaxed'], LP[f]['spread']['open'], offer), LP[f]['spread']['grip'], grip) for f in FING}
    rest_c = {f: [lerp(LP[f]['relaxed'][k], LP[f]['open'][k], offer) for k in range(3)] for f in FING}  # k = 0: the open hand


def build2(km):
    if LABMODE:
        s = {k: v for k, v in spec.items() if k != 'lab'}
        s['lab_curl'] = {f: [rest_c[f][k] + (target[f][k] - rest_c[f][k]) * km[f] for k in range(3)] for f in FING}
        s['lab_spread'] = lab_sp
        return s
    s = dict(spec)
    s['curl'] = {f: [target[f][0] if f != 'thumb' else target[f][0] * km[f], target[f][1] * km[f], target[f][2] * km[f]] for f in FING}
    return s


km = {f: 0.0 for f in FING}
Pw0 = positions(build2(km))
base_nb = {f: depth2(f, Pw0)[1] for f in LONG}


def ok_all(km, fingers):
    Pw = positions(build2(km))
    for f in fingers:
        dp, dn = depth2(f, Pw)
        lim_nb = max(base_nb[f] + 0.001, SIDE_CAP) if f in base_nb else LIM
        if dp > LIM or dn > max(lim_nb, LIM):
            return False
    return True


lo, hi = 0.0, 1.0
for _ in range(9):
    mid = (lo + hi) / 2
    if ok_all({**km, **{f: mid for f in LONG}}, LONG):
        lo = mid
    else:
        hi = mid
for f in LONG:
    km[f] = lo
common = lo
for f in ['pinky', 'ring', 'middle', 'index']:
    l2, h2 = km[f], 1.0
    for _ in range(8):
        mid = (l2 + h2) / 2
        if ok_all({**km, f: mid}, LONG):
            l2 = mid
        else:
            h2 = mid
    km[f] = l2
l2, h2 = 0.0, 1.0
for _ in range(9):
    mid = (l2 + h2) / 2
    if ok_all({**km, 'thumb': mid}, ['thumb'] + LONG):
        l2 = mid
    else:
        h2 = mid
km['thumb'] = l2
final = build2(km)
Pw = positions(final)
check = {f: [round(x * 1000, 2) for x in depth2(f, Pw)] for f in FING}
out = dict(pose=pose, weights=tag, limit_mm=LIM * 1000, common_k=round(common, 3), k={f: round(v, 3) for f, v in km.items()},
           base_side_contact_mm={f: round(v * 1000, 2) for f, v in base_nb.items()}, final_depth_mm_palm_side=check,
           curl={f: [round(x, 1) for x in (final['lab_curl'] if LABMODE else final['curl'])[f]] for f in FING})
hc.save_json(os.path.join(rig, '_work', f'tuned_{pose}.json'), out)
print('H14B ' + json.dumps(out))
