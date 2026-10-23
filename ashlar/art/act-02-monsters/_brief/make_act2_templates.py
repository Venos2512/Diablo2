"""Act II monster scale/layout guides (measurement diagrams, NOT concept art).

Adapted from E:/map01-batch/make_r2_template.py. For each of 23 IDs x variants A/B it writes
  templates/<ID>_<A|B>.png   flat warm-grey guide: exact title, one flat dark H silhouette (U01 pilot) at exactly
                             1H per row, baseline, dashed height lines, span brackets, column labels
  templates/<ID>_<A|B>.json  layout + measurement facts (source ranges, chosen mids, separate estimates)
and templates/facts_all.json (all IDs). Sizes come from ashlar/ASHLAR_QUY_CHUAN_QUAI_VI.md section 4; a range
[a, b] is guided at its mid; everything not stated by a source (view widths, prop widths, polearm length...) is an
ESTIMATE and is recorded under "estimates", never under "source".

Usage: python make_act2_templates.py [--out DIR] [ID_A ...]      (no job args = all 46 + facts_all.json)

r2 (Opus review fixes): optional per-guide extras -- 'prop_box' (sized PROP block), 'hang' (3/4 suspended-paws band + cord
line), 'view_notes', 'alias', estimate-flagged height lines, a margin tick for a 1H line that sits < CLOSE_PX from the
exact crown line, and a per-guide right margin that grows only when a height label is wider than the default.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
OUT = HERE / 'templates'
CLOSE_PX = 12           # a 1H line closer than this to another height line is drawn as a margin tick
PILOT = Path('E:/Diablo2/ashlar/art/map-01-concepts/monsters/U01_shambler/vA/concept_v3.png')
BG = (141, 137, 131)  # flat warm mid-grey, same value as the accepted sheets' backdrop
FONT_T = ImageFont.truetype('C:/Windows/Fonts/cambriab.ttf', 40)  # lining figures
FONT_L = ImageFont.truetype('C:/Windows/Fonts/cambriab.ttf', 26)
FONT_S = ImageFont.truetype('C:/Windows/Fonts/cambria.ttc', 20)

SINGLE = (2172, 724)
DOUBLE = (1536, 1024)
MARGIN_R = 190          # default right margin for the dashed-line labels (grows per guide if a label is wider)
WIDE_ROWS = [['H', '3/4', 'LEFT', 'RIGHT'], ['H', 'FRONT', 'BACK']]
ORDER = ['H', '3/4', 'WEAPON', 'PROP', 'LEFT', 'RIGHT', 'FRONT', 'BACK']
SIDES = ('LEFT', 'RIGHT')
FB = ('FRONT', 'BACK')

QC = 'ashlar/ASHLAR_QUY_CHUAN_QUAI_VI.md'


def span(views, h, label):
    return {v: (h, label) for v in views}


def S(metric, rng, mid, unit, tag='Đề xuất'):
    """A source-stated measurement: raw range text, the mid used, label tag from the source file."""
    return dict(metric=metric, source_range=rng, mid=mid, unit=unit, tag=tag)


# pose: tpose (humanoid T-pose model views) | rig (non-humanoid neutral stance) | kneel | static
# w: estimated view widths in H  (Q = 3/4, W = weapon/prop cell, L = LEFT and RIGHT, F = FRONT and BACK)
SPEC = {
    'U06': dict(name='PALL-WIGHT', sec='4.1', pose='tpose', lines=[(1.15, 'top incl. armour 1.15H')],
                src=[S('h', '1.10–1.20H (G4, do giáp cao)', 1.15, 'H'), S('coffin L', '0.80–1.00H', 0.90, 'H')],
                w=dict(Q=1.05, W=0.85, L=0.70, F=1.30), weapon=('WEAPON', 'the shield and the one-handed weapon, side by side; the coffin stays on the back'),
                est=['view widths', 'WEAPON cell width', 'coffin is carried on the back: its 0.90H is a long-axis length, not a drawn line']),
    'U07': dict(name='PYRE-RISEN', sec='4.1', pose='tpose', lines=[(0.95, 'crown 0.95H')],
                src=[S('h', '0.90–1.00H (G3), lửa không tính vào h', 0.95, 'H')],
                w=dict(Q=0.75, L=0.50, F=1.15), est=['view widths']),
    'U08': dict(name='CHARNEL CHANTER', sec='4.1', pose='tpose', lines=[(0.95, 'crown 0.95H')],
                src=[S('h', '0.90–1.00H (G3), áo chùng mục', 0.95, 'H')],
                w=dict(Q=0.70, L=0.50, F=1.15), est=['view widths']),
    'U09': dict(name='OSSUARY-GLUTTON', sec='4.1', pose='tpose', lines=[(1.00, 'crown')],
                src=[S('h', '0.95–1.05H (G3), dính với đống xương', 1.00, 'H')],
                w=dict(Q=0.95, L=0.80, F=1.05), est=['view widths (include the stuck bone heap)']),
    'U10': dict(name='WALLSHADE', sec='4.1', pose='tpose', lines=[(0.95, 'crown 0.95H')],
                src=[S('h', '0.90–1.00H, trong mờ alpha thấp', 0.95, 'H')],
                w=dict(Q=0.65, L=0.45, F=1.15), est=['view widths']),
    'U11': dict(name='SCRIBE-SHADE', sec='4.1', pose='tpose', lines=[(0.95, 'top 0.95H')],
                src=[S('h', '0.90–1.00H (G3), cúi như đang viết', 0.95, 'H')],
                w=dict(Q=0.70, W=0.30, L=0.50, F=1.10), weapon=('WEAPON', 'the long quill pen'),
                est=['view widths', 'WEAPON cell width', 'the 3/4 view may stoop below 0.95H; the line is the neutral top']),
    'U12': dict(name='THE PRESSED', sec='4.1', pose='static', lines=[(1.35, 'crown 1.35H')],
                src=[S('h', '1.20–1.50H (G4)', 1.35, 'H'), S('W', '1.00–1.30H', 1.15, 'H')],
                w=dict(Q=1.25, L=0.95, F=1.15), spans=span(FB, 1.15, 'width 1.15H'),
                est=['LEFT/RIGHT/3/4 widths']),
    'D05': dict(name='HORNCLAN CINDER-CLAN', sec='4.2', pose='tpose', lines=[(0.995, 'top incl. horns 0.995H')],
                src=[S('h (Raider/Slinger/Chanter)', '0.90–1.09H (G3)', 0.995, 'H'), S('h (Breaker rank, NOT drawn)', '1.10–1.20H (G4)', 1.15, 'H')],
                w=dict(Q=0.75, W=0.60, L=0.50, F=1.10), weapon=('WEAPON', 'the pickaxe and the trough, side by side'),
                est=['view widths', 'WEAPON cell width', 'the Breaker 1.15H rank is recorded only; the guide is the base clan']),
    'W08': dict(name='BELL-BAT', sec='4.3', pose='rig', ruler=True, lines=[(0.25, 'top ~0.25H', True)],
                src=[S('W (wingspan)', '0.80–1.00H', 0.90, 'H'), S('body L', '0.25–0.30H', 0.275, 'H')],
                w=dict(Q=0.65, L=0.30, F=0.90), spans={**span(SIDES, 0.275, 'body 0.275H'), **span(FB, 0.90, 'wingspan 0.90H')},
                est=['view widths', 'top height 0.25H (no source height: ~ the body length, spread wings in FRONT/BACK)',
                     '3/4 width 0.65H (estimate: the 3/4 view may show the wings half open; was 0.40H)']),
    'F03': dict(name='EXHUMER', sec='4.4', pose='tpose', lines=[(1.025, 'crown 1.025H')],
                src=[S('h', '1.00–1.05H (G3)', 1.025, 'H'), S('W (hat brim)', '0.40–0.50H', 0.45, 'H')],
                w=dict(Q=0.80, W=0.75, L=0.55, F=1.20), spans=span(FB, 0.45, 'brim 0.45H'),
                weapon=('WEAPON', 'the long-bladed spade, the hooded lantern and the crossbow, side by side'),
                est=['view widths', 'WEAPON cell width']),
    'F04': dict(name='KNEELER', sec='4.4', pose='kneel', lines=[(0.715, 'kneeling 0.715H')],
                src=[S('h (kneeling)', '0.65–0.78H (G2, người cúi, đầu gối dính phiến)', 0.715, 'H'), S('slab L', '0.90–1.10H', 1.00, 'H')],
                w=dict(Q=1.15, W=1.00, L=1.05, F=1.05), weapon=('PROP', 'the stone slab the knees are fused to, shown flat on its own'),
                spans={'PROP': (1.00, 'slab 1.00H'), **span(SIDES, 1.00, 'slab 1.00H')},
                kneel='both knees on the slab/baseline, shins flat along it behind, hips back toward the heels, torso upright to hunched; head top at 0.715H; NO standing canon drawn',
                view_notes={'3/4': 'crawling kneeler pose (fast crawl, knees on the slab)',
                            'LEFT/RIGHT/FRONT/BACK': 'turnaround T-pose: arms level with the shoulders, arm span ~1H (estimate), kneeling legs preserved (knees on the slab, shins flat behind)'},
                content='CONTENT: the iron halo is inside the 0.715H head top. Draw it as close-fitted iron headgear (a band that sits on the head): NO penetration of the scalp, NO wound and NO blood visible (artdirection 3.8; LD 8.5 self-harm care).',
                est=['view widths', 'FRONT/BACK width 1.05H = T-pose arm span ~1H plus margin (was 0.70H)', 'no standing height exists in the source and none is guided']),
    'F05': dict(name='BELL-HEAD', sec='4.4', pose='tpose', lines=[(1.125, 'bell top 1.125H')],
                src=[S('h (incl. fixed bell)', '1.10–1.15H (G4)', 1.125, 'H')],
                w=dict(Q=0.80, L=0.60, F=1.25), est=['view widths']),
    'F06': dict(name='CENSER-BEARER', sec='4.4', pose='tpose', lines=[(1.00, 'crown')],
                src=[S('h (censer not counted)', '0.95–1.05H (G3)', 1.00, 'H')],
                w=dict(Q=0.75, W=0.35, L=0.50, F=1.15), weapon=('WEAPON', 'the iron censer with its chain coiled beside it'),
                est=['view widths', 'WEAPON cell width']),
    'F07': dict(name='TURNED EXHUMER', sec='4.4', pose='tpose', lines=[(1.025, 'crown 1.025H')],
                src=[S('h', '1.00–1.05H (G3), halo sắt kẹp mũ', 1.025, 'H')],
                w=dict(Q=0.80, W=0.40, L=0.55, F=1.20), weapon=('WEAPON', 'the long-bladed spade (as F03 Exhumer)'),
                est=['view widths', 'WEAPON cell width', 'weapon inherited from F03 ("Như Exhumer")']),
    'F08': dict(name='HALO KNIGHT', sec='4.4', pose='tpose', lines=[(1.15, 'halo top 1.15H')],
                src=[S('h (incl. inward-spike halo)', '1.10–1.20H (G4)', 1.15, 'H')],
                w=dict(Q=0.90, W=0.55, L=0.65, F=1.35), weapon=('WEAPON', 'the heavy two-handed slam weapon'),
                est=['view widths', 'WEAPON cell width', 'weapon type is not stated in the source (only "cú đập lan ra lửa thánh")']),
    'F09': dict(name='CHANCERY GUARD', sec='4.4', pose='tpose', lines=[(1.025, 'crown 1.025H'), (1.30, 'polearm ~1.30H', True)],
                src=[S('h (polearm not counted)', '1.00–1.05H (G3)', 1.025, 'H')],
                w=dict(Q=0.75, W=0.30, L=0.50, F=1.15), weapon=('WEAPON', 'the polearm (kích) standing upright; the chain ledger stays on the belt'),
                est=['view widths', 'WEAPON cell width', 'polearm length 1.30H (no source length)']),
    'P08': dict(name='KNEELER', sec='4.5', pose='kneel', lines=[(0.675, 'kneeling 0.675H')],
                src=[S('h (kneeling)', '0.60–0.75H (G2, quỳ)', 0.675, 'H')],
                w=dict(Q=0.80, L=0.80, F=1.05),
                kneel='both knees on the ground/baseline, shins flat behind, hips back toward the heels, stiff upright torso; head top at 0.675H; NO standing canon drawn',
                view_notes={'3/4': 'stiff kneel (dead worshipper risen stiffly from the pew, still kneeling; no crawl)',
                            'LEFT/RIGHT/FRONT/BACK': 'turnaround T-pose: arms level with the shoulders, arm span ~1H (estimate), kneeling legs preserved'},
                alias=dict(name='the Kneeling Dead', status='not approved', source='ASHLAR_MONSTER_CHECKLIST_VI.md item 1 / QUY_CHUAN 4.5',
                           use='metadata only: the title and every prompt use KNEELER; the ID P08 differentiates it from F04 Kneeler'),
                est=['view widths', 'FRONT/BACK width 1.05H = T-pose arm span ~1H plus margin (was 0.70H)']),
    'P09': dict(name='CHAIN-HUNG', sec='4.5', pose='tpose', lines=[(0.95, 'crown 0.95H')],
                src=[S('h', '0.90–1.00H (G3), xích không tính', 0.95, 'H')],
                w=dict(Q=0.70, W=0.50, L=0.50, F=1.10), weapon=('PROP', 'the chain and the plain hook, coiled on the ground'),
                content='CONTENT: ground-supported safe display. Feet on the baseline, standing; chains/hook only as a separate coiled PROP; NO hanged body, no hook through the body, no suspension.',
                est=['view widths', 'PROP cell width', 'canon "treo" (hung) is NOT drawn; shown standing per CONTENT 3.8']),
    'L01': dict(name='SAINT-STATUE', sec='4.6', pose='tpose', lines=[(1.125, 'crown 1.125H')],
                src=[S('h', '1.10–1.15H [LD §4.2]', 1.125, 'H', tag='LD')],
                w=dict(Q=0.70, W=0.45, L=0.50, F=1.15), weapon=('PROP', 'the small stone vault arch the statue holds up (not counted in h)'),
                prop_box=dict(w=0.45, h=0.40, inner='0.40H tall'), spans={'PROP': (0.45, 'arch 0.45H wide (est.)')},
                view_notes={'3/4': 'holds the small arch with both hands at chest height; the arch top stays below the crown',
                            'LEFT/RIGHT/FRONT/BACK': 'turnaround T-pose, empty-handed (the arch is the separate PROP, not drawn in these views)'},
                no_glow=True,
                est=['view widths', 'PROP arch size 0.45H wide x 0.40H tall (estimate; no source size)', 'the arch is not counted in h (h 1.125H is the statue only)']),
    'L02': dict(name='PLUMB-HOUND', sec='4.6', pose='rig', lines=[(0.70, 'V 0.70H (turnarounds)')],
                src=[S('V', '0.60–0.80H', 0.70, 'H'), S('L', '1.20–1.50H (Ld3)', 1.35, 'H')],
                w=dict(Q=1.45, W=0.35, L=1.45, F=0.55), weapon=('PROP', 'the plumb cord with its fixing ring / harness, coiled (no separate bob is invented)'),
                spans=span(SIDES, 1.35, 'body 1.35H'), no_glow=True,
                hang=dict(view='3/4', lift=(0.10, 0.20)),
                view_notes={'3/4': 'the stone hound hangs from the plumb cord attached at its back, the cord rising toward the top edge; swinging; paws 0.10-0.20H above the baseline; V 0.70H and L 1.35H keep their values; no glow',
                            'LEFT/RIGHT/FRONT/BACK': 'turnarounds stand on the baseline, for the V 0.70H measurement only'},
                est=['view widths', 'PROP cell width', 'paws lift 0.10-0.20H above the baseline in the 3/4 view (estimate); the shoulder then sits at ~0.80-0.90H in that view (derived: lift + V)',
                     'the hanging 3/4 keeps V and L; the turnarounds on the baseline are only the V measurement']),
    'L03': dict(name='GARGOYLE MORTARER', sec='4.6', pose='rig', lines=[(0.90, 'crouch top 0.90H')],
                src=[S('h (crouched)', '0.80–1.00H (G3)', 0.90, 'H'), S('W', '1.00–1.20H', 1.10, 'H')],
                w=dict(Q=1.05, L=0.85, F=1.10), spans=span(FB, 1.10, 'width 1.10H'), no_glow=True,
                est=['LEFT/RIGHT/3/4 widths']),
    'B06': dict(name='CHOIR OF NAILS', sec='4.8', pose='static', rows=WIDE_ROWS, lines=[(2.20, 'crown 2.20H')],
                src=[S('h', '2.00–2.40H (G5)', 2.20, 'H'), S('W (organ)', '2.50–3.50H (Ld4)', 3.00, 'H')],
                w=dict(Q=2.60, L=1.80, F=3.00), spans=span(FB, 3.00, 'organ 3.00H'),
                est=['3/4 and LEFT/RIGHT widths']),
    'B07': dict(name='BROTHER CASSIAN', sec='4.8', pose='tpose', lines=[(1.00, 'top incl. halo'), (0.93, 'skull crown ~0.93H', True)],
                src=[S('h', '0.95–1.05H (G3, quy mô người)', 1.00, 'H')],
                w=dict(Q=0.90, L=0.70, F=1.25),
                view_notes={'all views': 'standing neutral; the stone roots run along the baseline under/around the feet and do not lift the body'},
                est=['view widths (include the stone roots under the feet)',
                     'skull crown 0.93H is an estimate (the halo adds ~0.07H to the 1.00H top; no source value)',
                     'halo counted in h as a fixed part (rule 1.1); pose (standing vs kneeling) is not stated, neutral stance drawn']),
}
for _s in SPEC.values():
    _s['lines'] = [(ln + (False,))[:3] for ln in _s['lines']]   # (h, label, is_estimate)

# ---------------------------------------------------------------------------------------------------------------


def silhouette():
    im = Image.open(PILOT).convert('RGB')
    region = np.asarray(im.crop((40, 80, 340, 640))).astype(int)  # stops above the 'H' label
    bg = np.median(region[:10].reshape(-1, 3), axis=0)
    dark = (bg.sum() - region.sum(axis=2)) > 150  # stricter than the R2 helper: drops the faint ground shadow
    ys, xs = np.where(dark)
    mask = Image.fromarray((dark[ys.min():ys.max() + 1, xs.min():xs.max() + 1] * 255).astype('uint8'))
    core = region[dark].mean(axis=0)
    flat = Image.new('RGB', mask.size, tuple(int(v) for v in core))  # one flat dark colour: no pilot shading
    return flat, mask


SIL, SIL_MASK = silhouette()
SIL_ASPECT = SIL.width / SIL.height


def view_rows(spec):
    if 'rows' in spec:
        return spec['rows']
    cell = [spec['weapon'][0]] if 'weapon' in spec else []
    return [['H', '3/4'] + cell + ['LEFT', 'RIGHT', 'FRONT', 'BACK']]


def view_widths(spec):
    w = spec['w']
    out = {'3/4': w['Q'], 'LEFT': w['L'], 'RIGHT': w['L'], 'FRONT': w['F'], 'BACK': w['F']}
    if 'weapon' in spec:
        out[spec['weapon'][0]] = w['W']
    return out


def col_width(spec, view, base):
    """Column width in H: the larger of the estimated view and its span bracket."""
    sp = spec.get('spans', {}).get(view)
    return max(base, sp[0]) if sp else base


def top_height(spec):
    return max([1.0] + [ln[0] for ln in spec['lines']])


def margin_r(spec):
    """Right margin for the height labels: the default, widened only if a label of this guide is wider."""
    tw = max(FONT_S.getlength(ln[1]) for ln in [(1.0, '1H')] + spec['lines'])
    return max(MARGIN_R, int(tw) + 8)


def fit(spec, W, Hc, rows, v_avail):
    wd = view_widths(spec)
    mr = margin_r(spec)
    hpx = min(520, v_avail / (top_height(spec) * 1.04))
    for views in rows:
        need = SIL_ASPECT + sum(col_width(spec, v, wd[v]) for v in views[1:])
        hpx = min(hpx, (W - 80 - mr - 20 * (len(views) + 1)) / need)
    return int(hpx)


def dashed(draw, x0, x1, y, color, dash=14, gap=9, width=2):
    x = x0
    while x < x1:
        draw.line([(x, y), (min(x + dash, x1), y)], fill=color, width=width)
        x += dash + gap


def spread(ys, min_gap):
    """Push label centres apart (list sorted by y) until each is >= min_gap from its neighbour."""
    ys = list(ys)
    for _ in range(80):
        moved = False
        for i in range(1, len(ys)):
            d = ys[i] - ys[i - 1]
            if d < min_gap:
                s = (min_gap - d) / 2 + 0.01
                ys[i - 1] -= s
                ys[i] += s
                moved = True
        if not moved:
            break
    return ys


def draw_ghost(d, view, cx, base, w, h, spec, bg):
    """Faint size block for one view (small / kneeling creatures: the model keeps enlarging them)."""
    fill = tuple(min(255, c + 16) for c in bg)
    edge = tuple(max(0, c - 28) for c in bg)
    if view in ('WEAPON', 'PROP'):
        d.rectangle([cx - w / 2, base - h * 0.75, cx + w / 2, base], fill=fill, outline=edge, width=2)
    else:
        d.rectangle([cx - w / 2, base - h, cx + w / 2, base], fill=fill, outline=edge, width=2)


def inter(a, b, pad=2):
    return not (a[2] + pad <= b[0] or b[2] + pad <= a[0] or a[3] + pad <= b[1] or b[3] + pad <= a[1])


def build(job):
    sid, var = job.split('_')
    spec = SPEC[sid]
    rows = view_rows(spec)
    W, Hc = DOUBLE if len(rows) == 2 else SINGLE
    v_avail = 330 if len(rows) == 2 else 530
    hpx = fit(spec, W, Hc, rows, v_avail)
    title = f'{sid} {spec["name"]} — {var}'
    im = Image.new('RGB', (W, Hc), BG)
    d = ImageDraw.Draw(im)
    ink = tuple(max(0, c - 95) for c in BG)
    guide = tuple(max(0, c - 55) for c in BG)
    texts, cols, problems = [], [], []

    def put(name, xy, text, font, anchor, fill=ink, bgbox=False):
        bb = d.textbbox(xy, text, font=font, anchor=anchor)
        if bgbox:
            d.rectangle([bb[0] - 3, bb[1] - 1, bb[2] + 3, bb[3] + 1], fill=BG)
        d.text(xy, text, font=font, fill=fill, anchor=anchor)
        texts.append((name, bb))
        return bb

    put('title', (W / 2, 52), title, FONT_T, 'mm')
    sil_w = round(SIL.width * hpx / SIL.height)
    sil_r, mask_r = SIL.resize((sil_w, hpx), Image.LANCZOS), SIL_MASK.resize((sil_w, hpx), Image.LANCZOS)
    wd = view_widths(spec)
    top_h = top_height(spec)
    ghost = spec['pose'] == 'kneel' or max(ln[0] for ln in spec['lines']) < 0.6
    top, bottom = 95, Hc - 30
    row_h = (bottom - top) / len(rows)
    mr = margin_r(spec)
    right_edge = W - 40 - mr
    facts_rows = []
    for r, views in enumerate(rows):
        base = round(top + row_h * (r + 1) - 62)
        w_px = [sil_w] + [col_width(spec, v, wd[v]) * hpx for v in views[1:]]
        gap = (W - 80 - mr - sum(w_px)) / (len(views) + 1)
        if gap < 19:
            raise SystemExit(f'{job}: row {r} does not fit (gap {gap:.1f}px)')
        x = 40 + gap
        placed = []
        for v, wp in zip(views, w_px):
            cx = x + wp / 2
            placed.append((v, cx, wp))
            cols.append((v, r, (cx - wp / 2, base - top_h * hpx, cx + wp / 2, base)))
            if v == 'H':
                im.paste(sil_r, (round(cx - sil_w / 2), base - hpx), mask_r)
            elif ghost:
                ctr_h = spec['lines'][0][0] * hpx if spec['lines'] else hpx
                draw_ghost(d, v, cx, base, wd[v] * hpx, ctr_h, spec, BG)
            pb = spec.get('prop_box')
            if pb and v == 'PROP':   # sized PROP block (estimate), drawn in the ghost style
                bw, bh = pb['w'] * hpx, pb['h'] * hpx
                d.rectangle([cx - bw / 2, base - bh, cx + bw / 2, base], fill=tuple(min(255, c + 16) for c in BG),
                            outline=tuple(max(0, c - 28) for c in BG), width=2)
                put(f'prop box r{r}', (cx, base - bh / 2), pb['inner'], FONT_S, 'mm')
            hg = spec.get('hang')
            if hg and v == hg['view']:   # suspended paws band (estimate) + the plumb cord rising from the back to the top edge
                lo, hi = hg['lift']
                d.rectangle([cx - wp / 2, base - hi * hpx, cx + wp / 2, base - lo * hpx], fill=tuple(min(255, c + 16) for c in BG),
                            outline=tuple(max(0, c - 28) for c in BG), width=2)
                put(f'hang label r{r}', (cx, base - hi * hpx - 16), f'paws {lo:.2f}-{hi:.2f}H above the baseline (est.)', FONT_S, 'mm')
                yc0 = base - (lo + hi) / 2 * hpx - 0.70 * hpx   # cord leaves the back: shoulder = paws lift + V
                y = 118
                while y < yc0:
                    d.line([(cx, y), (cx, min(y + 12, yc0))], fill=guide, width=3)
                    y += 20
                put(f'cord label r{r}', (cx + 14, 130), 'plumb cord rises to the top edge', FONT_S, 'lm')
            if v in spec.get('spans', {}):
                length, label = spec['spans'][v]
                half = length * hpx / 2
                y = base + 12
                d.line([(cx - half, y), (cx + half, y)], fill=guide, width=2)
                for xe in (cx - half, cx + half):
                    d.line([(xe, y - 6), (xe, y + 6)], fill=guide, width=2)
                put(f'span {v} r{r}', (cx, base + 31), label, FONT_S, 'mm')
            put(f'label {v} r{r}', (cx, base + 64), v, FONT_L, 'mm')
            x += wp + gap
        d.line([(40, base), (W - 40, base)], fill=ink, width=2)
        # dashed height lines + labels in the right margin (pushed apart when close)
        lines = [(1.0, '1H', False)] + list(spec['lines'])
        merged = []
        for h, label, est in lines:
            if abs(h - 1.0) < 1e-9 and merged and abs(merged[0][0] - 1.0) < 1e-9 and label != '1H':
                merged[0] = (1.0, '1H = ' + label, False)
            else:
                merged.append((h, label, est))
        ys = [base - h * hpx for h, _, _ in merged]
        # a 1H line within CLOSE_PX of another (but not equal) height line is drawn as a short margin tick, so the exact
        # crown/top line is the only dashed line there and the two heights are never merged
        tick = [i for i, (h, _, _) in enumerate(merged) if abs(h - 1.0) < 1e-9
                and any(0 < abs(ys[i] - ys[j]) < CLOSE_PX for j in range(len(merged)) if j != i)]
        order = sorted(range(len(merged)), key=lambda i: ys[i])
        ly = spread([ys[i] for i in order], 26 if tick else 22)
        pair = set(tick) | {j for i in tick for j in range(len(merged)) if j != i and abs(ys[i] - ys[j]) < CLOSE_PX}
        lx = W - 44 - max([FONT_S.getlength(merged[i][1]) for i in pair] or [0])   # the pair's labels are left-aligned here
        for i, yy in zip(order, ly):
            if i not in tick:   # a displaced pair label would sit on the dashes: stop the line short of it
                dashed(d, 40, (lx - 12) if i in pair else (W - 40), round(ys[i]), guide)
            if i in pair:
                put(f'line {merged[i][1]} r{r}', (lx, yy), merged[i][1], FONT_S, 'lm', bgbox=True)
            else:
                put(f'line {merged[i][1]} r{r}', (W - 44, yy), merged[i][1], FONT_S, 'rm', bgbox=True)
        for i in tick:
            yt = round(ys[i])
            d.line([(lx - 44, yt), (lx - 12, yt)], fill=ink, width=3)
            texts.append((f'mark {merged[i][1]} r{r}', (lx - 44, yt - 2, lx - 12, yt + 2)))
        fl = []
        for i, (h, lab, est) in enumerate(merged):
            e = dict(label=lab, h=h, y=round(base - h * hpx))
            if est:
                e['estimate'] = True
            if i in tick:
                e['drawn_as'] = 'short margin tick (exact crown/top line drawn dashed; the two heights are not merged)'
            fl.append(e)
        facts_rows.append(dict(views=views, baseline_y=base, lines=fl))
        # span ruler for the smallest creature: 1H ruler with 0.1H ticks, in the free band above the size blocks
        if spec.get('ruler') and r == 0:
            x0 = placed[1][1] - placed[1][2] / 2
            yr = round(base - 0.55 * hpx)
            d.line([(x0, yr), (x0 + hpx, yr)], fill=guide, width=3)
            for k in range(11):
                xk = x0 + k * hpx / 10
                d.line([(xk, yr - (12 if k % 5 == 0 else 7)), (xk, yr + (12 if k % 5 == 0 else 7))], fill=guide, width=2)
            for k, lab in ((0, '0'), (5, '0.5H'), (10, '1H')):
                put(f'ruler {lab}', (x0 + k * hpx / 10, yr + 26), lab, FONT_S, 'mm')
    # ---- layout validation ------------------------------------------------------------------------------------
    for i, (n1, b1) in enumerate(texts):
        if b1[0] < 0 or b1[1] < 0 or b1[2] > W or b1[3] > Hc:
            problems.append(f'{n1} outside canvas')
        for n2, b2 in texts[i + 1:]:
            if inter(b1, b2):
                problems.append(f'text overlap: {n1} / {n2}')
    for i, (v1, r1, c1) in enumerate(cols):
        if c1[0] < 40 or c1[2] > right_edge + 1:
            problems.append(f'column {v1} r{r1} outside the drawing area')
        for v2, r2, c2 in cols[i + 1:]:
            if r1 == r2 and inter(c1, c2, 0):
                problems.append(f'columns overlap: {v1}/{v2} r{r1}')
    for n, b in texts:
        if n.startswith('line ') and any(inter(b, (c[0], c[1], c[2], c[3]), 0) for _, _, c in cols):
            problems.append(f'{n} touches a column')
        if n.startswith('line ') and b[0] < right_edge:
            problems.append(f'{n} starts left of the margin')
    for fr in facts_rows:
        for ln in fr['lines']:
            for n, b in texts:
                if not n.startswith(('line ', 'mark ')) and 'drawn_as' not in ln and b[1] - 3 <= ln['y'] <= b[3] + 3:
                    problems.append(f'dashed line {ln["label"]} crosses text {n}')
    topmost = min(b[1] for n, b in texts if n.startswith('line '))
    if topmost < 80:
        problems.append(f'top line label too close to the title ({topmost}px)')
    if problems:
        raise SystemExit(f'{job}: ' + '; '.join(problems))
    OUT.mkdir(parents=True, exist_ok=True)
    im.save(OUT / f'{job}.png')
    labels = sorted({v for row in rows for v in row}, key=ORDER.index)
    source = [dict(m, guide_value_H=m['mid']) for m in spec['src']]
    facts = dict(
        id=sid, variant=var, title=title, status='scale/layout guide only; not concept art; not approved',
        source_file=QC, source_section=spec['sec'], pose=spec['pose'], layout='two-row' if len(rows) == 2 else 'single',
        canvas=[W, Hc], backdrop_rgb=list(BG), hpx_per_H=hpx, silhouette_px=[sil_w, hpx], rows=facts_rows,
        labels=labels, source=source, weapon_cell=(dict(kind=spec['weapon'][0], contents=spec['weapon'][1]) if 'weapon' in spec else None),
        estimates=dict(notes=spec['est'], view_widths_H={v: wd[v] for v in sorted(wd, key=ORDER.index)},
                       spans=({v: dict(length_H=s[0], label=s[1]) for v, s in spec.get('spans', {}).items()}),
                       **({'prop_box_H': dict(width=spec['prop_box']['w'], height=spec['prop_box']['h'])} if 'prop_box' in spec else {}),
                       **({'hang_3q_paws_lift_H': list(spec['hang']['lift'])} if 'hang' in spec else {})),
        ghost_size_blocks=ghost, span_ruler=bool(spec.get('ruler')))
    for k in ('kneel', 'content', 'view_notes', 'alias'):
        if k in spec:
            facts[k] = spec[k]
    if spec.get('no_glow'):
        facts['no_glow'] = 'Lodge servant: never self-lit — no glow, no glowing eyes/edges/fire (Quy chuẩn §2.4, artdirection §6.3)'
    (OUT / f'{job}.json').write_text(json.dumps(facts, ensure_ascii=False, indent=1), encoding='utf-8')
    return facts


if __name__ == '__main__':
    args = sys.argv[1:]
    if '--out' in args:
        i = args.index('--out')
        OUT = Path(args[i + 1]).resolve()
        del args[i:i + 2]
    jobs = args or [f'{sid}_{v}' for sid in SPEC for v in 'AB']
    allf = {}
    for job in jobs:
        f = build(job)
        allf[job] = f
        print(job, f['layout'], f['canvas'], 'hpx', f['hpx_per_H'])
    if not args:
        (OUT / 'facts_all.json').write_text(json.dumps(allf, ensure_ascii=False, indent=1), encoding='utf-8')
