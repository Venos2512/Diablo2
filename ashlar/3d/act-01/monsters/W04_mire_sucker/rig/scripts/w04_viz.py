"""Colours for W04 QA renders (plain Python): one hue per body part, lighter/darker per segment, R side shifted."""
import colorsys

BASE = {'thorax': 0.08, 'head': 0.75, 'proboscis': 0.92, 'abdomen_01': 0.0, 'abdomen': 0.97, 'WingF': 0.55, 'WingB': 0.47,
        'Leg1': 0.30, 'Leg3': 0.17}


def color(name):
    for k, h in BASE.items():
        if k in name:
            seg = int(name[-1]) if name[-1].isdigit() else 1
            side = 0.035 if name.startswith('R_') else 0.0
            if k == 'thorax':
                return (0.62, 0.50, 0.38)
            if k == 'head':
                return (0.55, 0.35, 0.85)
            v = 1.0 - 0.17 * (seg - 1)
            s = 0.55 + 0.12 * (seg - 1)
            return colorsys.hsv_to_rgb((h + side) % 1.0, min(s, 0.95), max(v, 0.45))
    return (0.6, 0.6, 0.6)


def blend(names, row):
    """weighted colour of one vertex (row: weights aligned with names)."""
    c = [0.0, 0.0, 0.0]
    t = 0.0
    for nm, w in zip(names, row):
        if w > 0:
            cc = color(nm)
            for i in range(3):
                c[i] += cc[i] * w
            t += w
    return tuple(ci / t for ci in c) if t > 0 else (0.1, 0.1, 0.1)
