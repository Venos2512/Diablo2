"""Batch 2 item sheets (rest of Act I + Lychgate shop stock, ashlar/docs/ASHLAR_ITEMS_VI.md): writes <sheet>.template.json and
<sheet>.desc.txt. Shared format text comes from batch1/make_descs.py (D2 grid, D2 view)."""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
B1 = os.path.join(HERE, '..', 'batch1', 'make_descs.py')
ns = {'__file__': B1}
exec(open(B1, encoding='utf-8').read().split('\n\nSHEETS')[0], ns)  # batch-1 header + COMMON, without its SHEETS and loop
COMMON = ns['COMMON']
STRICT = ('FOOTPRINT SIZE IS STRICT: every box keeps exactly the size and place it has in the layout guide; never enlarge, redraw or '
          'move a box; small items stay small and leave empty backdrop around them.')

SHEETS = {
    'IT-06_brannoc_weapons': ('ASHLAR ITEMS — IT-06 BRANNOC THE MORTSMITH: WEAPONS',
        'Smith-made weapons sold in Lychgate: honest forged iron and oak, a little better made than the Prologue scraps.', [
        ('W02 WINGED MACE', 2, 3, 'Short oak-hafted mace with a forged iron head of six flanges, silver coffin-nail studs at the collar, leather grip.'),
        ('W03 BIER-POLE', 2, 4, 'Long dark oak pole, both ends capped in silver shaped like domed coffin-nail heads, two iron rings along the shaft, rope wrapping at the middle.'),
        ('W08 REED SICKLE', 1, 3, 'Small crescent iron sickle on a worn ash-wood handle, a dry fen reed tied to the tang.'),
        ('W16 FLINT HAND-AXE', 2, 3, 'One-handed axe with a forged iron head, knapped black flint inlay along the cheek, hide-wrapped haft.')]),
    'IT-07_shields_heavy': ('ASHLAR ITEMS — IT-07 SHIELDS AND HEAVY PIECES',
        'Heavy gear from the smithy and the Pall order.', [
        ('O02 PALL COFFIN-LID', 2, 4, 'Tall narrow hexagonal oak coffin-lid shield, thick iron rim, a ring of large silver coffin-nails round the edge, and at the centre ONE Wedge (a keystone trapezoid, flat top wider than the flat bottom) made of nail heads; no crossing lines.'),
        ('O07 MORTSAFE-GRILLE SHIELD', 2, 3, 'Rectangular shield of black wrought-iron grave-cage bars, all VERTICAL, riveted to an oak back, one bent bar re-welded, a plain round iron boss.'),
        ('A11 NAILED GAUNTLET', 2, 2, 'One broad iron gauntlet seen from the back of the hand, silver coffin-nails set in the knuckle plates, rope-burned leather cuff.'),
        ('A13 IRON-SHOD SABATONS', 2, 2, 'Pair of heavy black iron-plated boots side by side, riveted toe caps, silver nail heads along the instep.')]),
    'IT-08_lychgate_armour': ('ASHLAR ITEMS — IT-08 LYCHGATE ARMOUR',
        'Mid-weight and light village gear sold by Brannoc and Nell.', [
        ('A03 PATCHED BRIGANDINE', 2, 3, 'Faded oxblood canvas brigandine laid flat from the front, rows of iron rivet heads, two mismatched patches, buckled side straps.'),
        ('A04 OILSKIN COAT', 2, 3, 'Stiff dark green oilskin coat laid flat from the front with a short shoulder cape, horn toggles, a salt-white tide line at the hem.'),
        ('A06 SEXTON\'S COWL', 2, 2, 'Grey wool hood with a short shoulder cape seen from the front, darned at the crown, a sprig of dried poppy tucked at the edge.'),
        ('A14 SEXTON\'S TOOL BELT', 2, 1, 'Wide leather belt laid horizontally with an iron buckle, a ring of three old keys, a chalk pouch and a small trowel loop.')]),
    'IT-09_small_goods': ('ASHLAR ITEMS — IT-09 SMALL GOODS',
        'Small things from the Lychgate stalls and the dead.', [
        ('C04 VOTIVE CANDLE', 1, 1, 'Thick tallow candle stub fused to a tin saucer, wick blackened and unlit, wax drips down one side.'),
        ('C05 LAMP OIL FLASK', 1, 2, 'Flat dented tin flask standing upright, screw spout at the top, leather strap, an oily amber sheen at the spout.'),
        ('G02 EYE-COINS', 1, 1, 'Pair of thin bent copper coins, green-tarnished, threaded on a frayed black ribbon.'),
        ('J02 BONE RING', 1, 1, 'Thick ring carved from a single knuckle bone, yellowed ivory, a hairline crack filled with grey mortar.'),
        ('M04 SILVER COFFIN-NAILS', 1, 2, 'Bundle of five long square-shanked silver nails standing upright, domed heads at the top, tied with black cord.')]),
    'IT-10_act1_quest': ('ASHLAR ITEMS — IT-10 ACT I QUEST ITEMS',
        'Story objects of Act I, plain and believable.', [
        ('Q02 OLDEST VOLUME', 2, 2, 'Small crumbling ledger with wooden boards and a rusted clasp, faded brown edges, seen almost straight-on.'),
        ('Q03 EDDA\'S BROTH BOWL', 2, 2, 'Plain wooden bowl with a horn spoon resting in it, warm brown broth, one faint painted steam curl.'),
        ('Q05 CUP OF POPPY TEA', 2, 2, 'Clean white glazed cup on a saucer, pale red tea, a single poppy petal floating; too perfect and spotless.'),
        ('Q07 WILLOW BRIDE\'S VEIL', 2, 3, 'Long waterlogged lace veil hanging straight down, tangled with willow leaves and pond weed, a small tarnished pin at the top.')]),
    'IT-11_keys': ('ASHLAR ITEMS — IT-11 KEYS',
        'Keys standing upright, bow at the top, bit at the bottom.', [
        ('K01 OSSUARY GRILLE KEY', 1, 2, 'Long black iron key with a round bow shaped like a skull-niche arch, flint-grey rust.'),
        ('K02 BARROW VAULT KEY', 1, 2, 'Old bronze key with five notches in its bit, a knot of faded ribbon at the bow.'),
        ('K03 GENTLE HOUSE GATE KEY', 1, 2, 'Clean pale iron key, untarnished and too smooth, a poppy-shaped bow, on a white linen loop.')]),
}

for sid, (title, note, items) in SHEETS.items():
    json.dump({'canvas': [2172, 724], 'cell': 118, 'title': title,
               'items': [{'label': lab, 'w': w, 'h': h} for lab, w, h, _ in items]},
              open(os.path.join(HERE, sid + '.template.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    lines = [COMMON, f'SHEET: title exactly "{title}". {note}', 'ITEMS, left to right (footprint W x H cells):']
    lines += [f'{i}. label "{lab}" ({w}x{h}): {d}' for i, (lab, w, h, d) in enumerate(items, 1)]
    lines += [STRICT, 'Text: the exact title and the item labels only; no other text, no watermark.']
    open(os.path.join(HERE, sid + '.desc.txt'), 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
    print(sid, len(items))
