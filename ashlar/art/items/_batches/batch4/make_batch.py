"""Batch 4 item sheets: everything left in ashlar/docs/ASHLAR_ITEMS_VI.md after batches 1-3 (Acts III-V, Epilogue, rings, crafting
materials, late class weapons). Writes <sheet>.template.json and <sheet>.desc.txt; shared format text from batch1/make_descs.py."""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
B1 = os.path.join(HERE, '..', 'batch1', 'make_descs.py')
ns = {'__file__': B1}
exec(open(B1, encoding='utf-8').read().split('\n\nSHEETS')[0], ns)  # batch-1 header + COMMON, without its SHEETS and loop
COMMON = ns['COMMON']
STRICT = ('FOOTPRINT SIZE IS STRICT: every box keeps exactly the size and place it has in the layout guide; never enlarge, redraw or '
          'move a box; small items stay small and leave empty backdrop around them.')
PAL = {
    3: 'ACT III PALETTE (the Blanched Sea, a dead sea turned to salt): bone white #EDEAE0, milky sky #DCE3E6, brine teal #3F8C88, rust #8A4B2D; red only as a small blood stain where stated.',
    4: 'ACT IV PALETTE (the Hoarfast, frozen north): black-blue ice #14202E, frost blue #6F8FA8, old jewel colours garnet #7A3B47, emerald #3F6B5A, old gold #B59A5B, amber lamp #E5A44C.',
    5: 'ACT V PALETTE (Lanternshore): storm slate #3B4650, sea green #2F5A52, wet black stone #121417, foam white #E8EEEA, lamp gold #F2C14E.',
}

SHEETS = {
    'IT-16_late_class_gear': ('ASHLAR ITEMS — IT-16 LATE CLASS WEAPONS', [3, 4],
        'Class weapons sold in the Act III-V hubs.', [
        ('W07 BONE-WAND', 1, 2, 'Bundle of finger bones bound with waxed cord, standing upright, topped by a small fan of splayed finger bones, a grey mortar handprint on the grip.'),
        ('W10 DRIFTWOOD STAFF', 2, 4, 'Crooked bleached driftwood staff standing upright, crowned with a cluster of blue-grey salt crystals, rope bindings, two shells and a hanging green glass float.'),
        ('W15 PYRE-STAFF', 2, 4, 'Tall black birch staff standing upright, topped by a small iron cage holding a burning log (a small painted flame), red thread braided under the cage.'),
        ('A08 ASH-VEIL', 2, 2, 'Black iron circlet seen from the front with a long veil of pale ash-white gauze hanging down behind it, red thread knots at the temples.')]),
    'IT-17_rings_materials': ('ASHLAR ITEMS — IT-17 RINGS AND MATERIALS', [],
        'Small rings and crafting materials from every act; none of them glows.', [
        ('G04 FUNERAL RING', 1, 1, 'Plain thin pewter ring, a scratched line of marks on it, a tiny loop of black thread knotted through it.'),
        ('J03 MASON\'S SIGNET', 1, 1, 'Heavy grey iron signet ring with a flat face cut with an angular mason\'s mark, rough chisel facets.'),
        ('J07 SALT-GLASS RING', 1, 1, 'Milky translucent salt-glass ring, smooth outside, one deliberate chip at the rim.'),
        ('M01 GREY MORTAR', 1, 1, 'Fist-sized lump of grey mortar with a few bone chips set in it, a handprint pressed into one side.'),
        ('M02 MASON-STONE CHIP', 1, 1, 'Sharp-edged pale grey stone fragment with a scribed guide line and part of an angular mason\'s mark.'),
        ('M03 KILN-GLAZE SHARD', 1, 1, 'Curved brick-red fired-clay shard with a dark crackled glaze, a clear thumbprint, soot at one edge.'),
        ('M07 SALT-GLASS', 1, 1, 'Rough block of milky salt-glass, crisp faceted breaks on one end, smooth and polished on the other.'),
        ('M08 FROST-TEMPERED STEEL', 1, 2, 'Short dark blue-grey steel ingot standing upright, rimed with white frost at the edges, a smith\'s stamp.')]),
    'IT-18_act3_quest': ('ASHLAR ITEMS — IT-18 ACT III QUEST ITEMS', [3],
        'Story objects of Namakhar and the salt sea, plus one late Act I scrap.', [
        ('Q06 SHROUD BILL OF SALE', 1, 1, 'Torn scrap of paper with a smudged tally of marks, a coin-stain ring and a doodled smiling face.'),
        ('Q12 NAREH\'S CONTRABAND', 2, 2, 'Small open wooden crate seen from the front holding a bottle of red wine, an ink pot, a pair of bone dice, a roll of dyed cloth and a small tin.'),
        ('Q13 THE CHIPPED CUP', 1, 1, 'Simple greenish clay drinking cup, a clear chip in the rim, a thumb-worn glaze.'),
        ('Q14 WHISPERING-CRYSTAL', 1, 1, 'Palm-sized cloudy crystal, geometric and flawless, faint concentric rings inside like sound; no glow.'),
        ('Q15 THE SALT CROWN', 2, 2, 'Delicate crown of white salt-glass spires seen from the front, one spire snapped off, salt-crusted fish scales stuck at the base.'),
        ('R03 THE INKMAN\'S MARK', 1, 2, 'Upright strip of pale skin-coloured vellum with a dense spiral of small dark tattooed marks (not readable), a bone needle beside it.')]),
    'IT-19_act4_5_epilogue': ('ASHLAR ITEMS — IT-19 ACT IV, ACT V AND EPILOGUE', [4, 5],
        'Story objects of the frozen north, Lanternshore and the end.', [
        ('Q16 MILA\'S MUSIC BOX', 2, 2, 'Small lacquered wooden box seen from the front, lid slightly open, a tiny brass crank on the side, faded painted spring flowers on the lid.'),
        ('Q17 THE LIVING FLOWER', 1, 2, 'One small pale-yellow flower in a little pot of soil under a thick glass bell jar, a faint fog of breath on the glass.'),
        ('Q18 SEVERIN\'S LETTER', 1, 1, 'Folded letter of old paper sealed with a plain drop of white wax, faded ink showing through, a salt-stained corner.'),
        ('Q19 MAELYS\'S CANDLE', 1, 1, 'Short stub of beeswax candle, wick blackened and unlit, a loop of twine tied round it, wax fused to the twine.'),
        ('R04 SILVER COFFIN-NAIL', 1, 2, 'One long silver coffin-nail standing upright, domed head at the top stamped with a Wedge, slightly bent, a thread of black ribbon tied below the head.'),
        ('G06 SALVAGE BRASS', 2, 2, 'Barnacled brass ship\'s fitting and a green-crusted spoon lying together, wet sheen, a strand of kelp.'),
        ('Q20 THE PEAR', 1, 1, 'One ripe golden-green pear with a short stem and a single leaf, slightly bruised on one side.')]),
}

for sid, (title, acts, note, items) in SHEETS.items():
    json.dump({'canvas': [2172, 724], 'cell': 118, 'title': title,
               'items': [{'label': lab, 'w': w, 'h': h} for lab, w, h, _ in items]},
              open(os.path.join(HERE, sid + '.template.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    lines = [COMMON] + [PAL[a] for a in acts] + [f'SHEET: title exactly "{title}". {note}', 'ITEMS, left to right (footprint W x H cells):']
    lines += [f'{i}. label "{lab}" ({w}x{h}): {d}' for i, (lab, w, h, d) in enumerate(items, 1)]
    lines += [STRICT, 'Text: the exact title and the item labels only; no other text, no watermark.']
    open(os.path.join(HERE, sid + '.desc.txt'), 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
    print(sid, len(items))
