"""Batch 3 item sheets: Act II, Sepulcra (ashlar/docs/ASHLAR_ITEMS_VI.md: Ansel Crane, Pardoner Quint, Old Vellum, Act II relics,
quest items and keys). Writes <sheet>.template.json and <sheet>.desc.txt; shared format text from batch1/make_descs.py."""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
B1 = os.path.join(HERE, '..', 'batch1', 'make_descs.py')
ns = {'__file__': B1}
exec(open(B1, encoding='utf-8').read().split('\n\nSHEETS')[0], ns)  # batch-1 header + COMMON, without its SHEETS and loop
COMMON = ns['COMMON']
STRICT = ('FOOTPRINT SIZE IS STRICT: every box keeps exactly the size and place it has in the layout guide; never enlarge, redraw or '
          'move a box; small items stay small and leave empty backdrop around them.')
ACT2 = ('ACT II PALETTE (Sepulcra, the holy city of the Graveteeth): soot black #17151A, bone white #E6DFCF, candle gold #D9A441, '
        'bell bronze and verdigris; small pyre-orange #E2622B only where stated; no green except verdigris on bronze.')

SHEETS = {
    'IT-12_ansel_crane_weapons': ('ASHLAR ITEMS — IT-12 ANSEL CRANE: WEAPONS',
        'Sold by the bell-founder of Lowcourse from the Exhumers\' stores: well made, dark iron, oiled wood, silver touches.', [
        ('W05 KNOTTED SCOURGE', 2, 3, 'Short wooden handle bound in linen at the bottom, two heavy chains hanging down side by side ending in spiked iron balls, a single loop-knot iron charm at the pommel; handle at the top, chains hanging below.'),
        ('W12 EXHUMER\'S SPADE', 2, 4, 'Long narrow spade standing upright with the blade at the TOP, silver-edged blade with a cut-out open-grave seal shape, black iron socket, oiled ash shaft.'),
        ('W13 EXHUMER\'S CROSSBOW', 2, 4, 'Heavy crossbow standing upright with the steel prod at the TOP and the stock pointing down, a side crank winder, dark oiled stock, three silver-tipped bolts clipped under the tiller.')]),
    'IT-13_pall_exhumer_armour': ('ASHLAR ITEMS — IT-13 PALL AND EXHUMER ARMOUR',
        'Heavy Pall order armour and Exhumer field gear, sold in Sepulcra.', [
        ('A05 PALL CUIRASS', 2, 3, 'Black steel breastplate laid flat from the front, a Wedge (keystone trapezoid, flat top wider than flat bottom) of silver nail-heads at the sternum, purple cloth at the collar, iron coffin-nail rivets; no crossing lines.'),
        ('A09 PALL GREAT-HELM', 2, 2, 'Flat-topped dark steel helm seen from the front, a narrow horizontal eye slit with a short vertical breath slit below it, a ring of silver nail studs, a small iron bell tied at the nape.'),
        ('A07 WIDE-BRIM HAT', 2, 2, 'Brown felt wide-brimmed hat seen from the front, one side of the brim pinned up, a cream cloth patch stitched over the crown where a seal was cut off.'),
        ('A15 TEN-KNOT CORD', 2, 1, 'Thick red waist cord laid horizontally with ten evenly spaced knots, one end bound in linen with a single iron loop-knot charm.')]),
    'IT-14_sepulcra_small_goods': ('ASHLAR ITEMS — IT-14 SEPULCRA SMALL GOODS',
        'Pardons, charms and keys of the holy city.', [
        ('C03 MORTAR-ASH POUCH', 1, 1, 'Small grey linen pouch tied with black cord, a smear of pale grey ash on the cloth.'),
        ('J04 WEDGE PENDANT', 1, 1, 'Small grey stone pendant shaped as a Wedge (keystone trapezoid, flat top wider than flat bottom) on a dark cord, a tiny iron bail, edges polished smooth.'),
        ('J05 CRACKED WEDGE', 1, 1, 'Bronze Wedge-shaped amulet (keystone trapezoid) split by a deliberate crack down the middle, the halves bound together with black thread.'),
        ('J06 BELL-BRONZE PENDANT', 1, 1, 'Small cast-bronze disc with a verdigris edge and a raised band of unreadable marks round the rim, on a leather thong.'),
        ('M06 BELL-BRONZE SCRAP', 1, 1, 'Jagged curved fragment of a bronze bell rim, green verdigris, a few raised unreadable marks.'),
        ('G05 DEED OF THE UPPER COURSE', 1, 2, 'Rolled vellum certificate standing upright, a heavy grey wax seal in a Wedge shape hanging on a ribbon, flaking gilt edge.'),
        ('K04 CHANCERY LEDGER KEY', 1, 2, 'Ornate gilt brass key standing upright, a Wedge-shaped bow at the top, a tiny blank tag on a thread.'),
        ('K05 BELL-PIT KEY', 1, 2, 'Heavy bronze key standing upright, a bell-shaped bow at the top, verdigris, raised unreadable marks on the shank.')]),
    'IT-15_act2_relics_quest': ('ASHLAR ITEMS — IT-15 ACT II RELICS AND QUEST ITEMS',
        'Story objects of Act II; plain, heavy with meaning, no magic look, no glow.', [
        ('Q08 UNEDITED TESTAMENT', 2, 2, 'Small plain hand-sewn book of yellowed vellum seen almost straight-on, an old grey wax seal broken open on its edge.'),
        ('Q09 ON THE TERM', 1, 2, 'Thin folded report standing upright in a sleeve sealed with black wax stamped with a plain square seal.'),
        ('Q10 THE IRON HALO', 2, 2, 'Heavy black iron crown seen from the front, short spikes pointing INWARD toward the centre, rust at the points; no blood.'),
        ('Q11 IGNATIA\'S BROKEN SEAL', 1, 2, 'Iron badge in the shape of an open grave, snapped cleanly in two, both halves hanging one above the other on a frayed cord.'),
        ('R02 THE TONGUELESS BELL', 2, 2, 'Small hand-bell of old green-patinated bronze seen from the front, mouth down, no clapper visible inside, a raised band of unreadable marks round the rim, a cracked leather strap handle on top.')]),
}

for sid, (title, note, items) in SHEETS.items():
    json.dump({'canvas': [2172, 724], 'cell': 118, 'title': title,
               'items': [{'label': lab, 'w': w, 'h': h} for lab, w, h, _ in items]},
              open(os.path.join(HERE, sid + '.template.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    lines = [COMMON, ACT2, f'SHEET: title exactly "{title}". {note}', 'ITEMS, left to right (footprint W x H cells):']
    lines += [f'{i}. label "{lab}" ({w}x{h}): {d}' for i, (lab, w, h, d) in enumerate(items, 1)]
    lines += [STRICT, 'Text: the exact title and the item labels only; no other text, no watermark.']
    open(os.path.join(HERE, sid + '.desc.txt'), 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
    print(sid, len(items))
