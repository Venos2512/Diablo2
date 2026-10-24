"""Write the desc.txt of each item sheet in batch 1 (ashlar/docs/ASHLAR_ITEMS_VI.md §4). Item texts are the catalogue's EN descriptions."""
import os

HERE = os.path.dirname(os.path.abspath(__file__))

COMMON = (
    "Asset type: ASHLAR item concept sheet for inventory and shop icons, pending_user_review. Input images 1 and 2 are approved "
    "ASHLAR Act I sheets: style reference only, match their hand-painted rendering, chunky readable shapes, broad painted planes "
    "and the way their WEAPON cells are painted; never copy their designs or colours.\n"
    "ITEM SHEET FORMAT (overrides the turnaround rules of the sheet block): Diablo II inventory icons. Input image 3 is the mandatory "
    "layout guide: keep its backdrop, title, labels and every footprint box exactly where they are, with their faint cell grid lines; "
    "paint each item INSIDE its footprint box (W x H inventory cells), filling the box like a Diablo II inventory item fills its cells, "
    "touching nothing outside it. VIEW like Diablo II inventory art: almost straight-on, near-orthographic, no strong perspective, "
    "items upright (blades, shafts and handles vertical with the head or business end at the TOP, tilted at most 10 degrees), "
    "clothing and armour laid flat seen from the front, gloves and boots as a pair side by side, light from the upper left. "
    "Each item drawn ONCE. No frames, no rarity borders, no human figure, no hands holding the items, no extra views.\n"
    "ITEM RENDERING: each item is built from two or three BIG simple shapes with clear form shading (lit side, shadow side, a few "
    "crisp highlights), readable as a silhouette at 64 px; at most two or three large wear marks per item (one dent, one patch, one "
    "chip), never scratches, grain, rust speckle or grunge. Materials read apart: iron, wood, cloth, clay, bone, glass, silver. "
    "Objects never glow and never have magic effects; a flame or a lit wick is painted only where stated. Soft contact shadow under "
    "each item.\n"
    "ASHLAR CULTURE: the only church sign is the Wedge, a keystone shape (a wide trapezoid with a flat top and a narrower flat bottom, NEVER a triangle), used only where stated; "
    "no crosses, no real religious symbols, no readable words on objects.\n")


SHEETS = {
    'IT-01_prologue_weapons': ('ASHLAR ITEMS — IT-01 PROLOGUE IMPROVISED WEAPONS',
        'Rubble-tier weapons the risen hero grabs in the ossuary: grey mortar dust on them, mismatched old metal, plain and poor.', [
        ('W01 IRON CANDLE-STAND', 'Tall black iron pricket candle-stand used as a mace, its three-footed base is the striking head, wax crusted on the spikes.'),
        ('W04 BELL-ROPE CHAIN', 'Thick red-brown bell-rope with a knotted length of rusty iron chain tied to its end, the rope tassel still on.'),
        ('W06 BONE-HOOK', 'Iron hook on a long bone handle, used to pull skulls from wall niches; grey mortar dust in the crook.'),
        ('W09 JAR OF GRAVE-SALT', 'Squat unglazed clay jar with a cloth-tied mouth, coarse grey-white salt spilling from a crack in its side.'),
        ('W11 RUSTED GRAVE-SPADE', 'Old long-bladed grave-spade, rust-brown blade with one nicked edge, split wooden T-grip mended with wire.'),
        ('W14 VOTIVE TORCH', 'Short iron-banded wooden torch from an ossuary stand, pitch-soaked rag head, UNLIT, soot on the bands.')]),
    'IT-02_class_offhands': ('ASHLAR ITEMS — IT-02 CLASS OFF-HANDS',
        'The class items of the six vocations, sturdy and plain.', [
        ('O01 TORN COFFIN-LID', 'Tall narrow hexagonal adult coffin lid of grey weathered planks, splintered hinge side, a rope handle knotted through two holes; only vertical edge bands, never crossing straps.'),
        ('O03 BRANDING IRON', 'Long iron rod with a wrapped wooden grip and a single loop-knot shaped brand at the tip; the tip painted glowing orange-hot.'),
        ('O04 RELIQUARY', 'Small house-shaped box of carved bone panels with silver corners on a short chain, eight round empty sockets in two rows on the front.'),
        ('O05 BRINE-FLASK', 'Round glass flask in a rope net with a carry loop, cloudy swirling teal brine inside, white salt crust growing down from the neck.'),
        ('O06 HOODED LANTERN', 'Brass lantern with five vertical slats and a hinged iron hood half closed, a glass oil well showing the oil level, short hook chain; unlit.')]),
    'IT-03_starting_armour': ('ASHLAR ITEMS — IT-03 STARTING ARMOUR',
        'Poor village clothing of Lychgate, folded or laid out as inventory items.', [
        ('A01 BURIAL SHROUD', 'Folded off-white linen burial shroud with grey mortar dust in the folds, one big torn hem corner, a strip of jaw-binding cloth on top.'),
        ('A02 GENNET\'S COAT', 'Long wide peat-brown wool coat laid out, deep pockets, high collar, two big patches, one burn hole near a pocket.'),
        ('A10 GRAVEDIGGER\'S GLOVES', 'Pair of thick oiled brown leather work gloves, one thumb worn through, a strip of mortar-grey cloth wrapped at each cuff.'),
        ('A12 PEAT-CUTTER\'S BOOTS', 'Pair of knee-high muddy brown leather boots, twine wrapped below the knee, a patched toe, dark dried peat on the soles.')]),
    'IT-04_relics_act1': ('ASHLAR ITEMS — IT-04 RELICS AND ACT I QUEST ITEMS',
        'Story objects; plain, worn, believable, no magic look.', [
        ('J01 SEVERIN\'S PROMISE', 'Plain tarnished silver ring, slightly worn thin on one side, no gem, no glow, no visible writing.'),
        ('R01 OSRIC\'S LANTERN', 'Simple old iron hand lantern with ONE hinged hood, plain glass, no slats and no notches, a ring handle; unlit.'),
        ('Q01 BOOK OF LAID NAMES', 'Huge thick ledger bound in cracked black leather with iron corners, many coloured ribbon markers, page edges uneven and yellowed.'),
        ('Q04 FERRYMAN\'S TIN', 'Dented rusty flat tobacco tin, lid open, full of mismatched copper and silver coins, water drops on the lid, a small lock of hair tied to the hinge with thread.'),
        ('M05 HUSH-POPPY', 'Bunch of three red poppies with long pale stems and seed heads, a few petals falling, stems tied with a white thread.')]),
    'IT-05_consumables_coin': ('ASHLAR ITEMS — IT-05 CONSUMABLES AND COIN',
        'Everyday goods of the Lychgate market.', [
        ('C01 DRAUGHT', 'Squat grey stoneware flask with a wax-sealed cork, a small Wedge stamped in the clay, dark red liquid at a chipped lip, a twine loop handle.'),
        ('C02 WAKING SALTS', 'Small horn snuff-box with a hinged brass lid open, coarse white crystals inside, a sprig of dried rosemary tied to it.'),
        ('G01 COIN', 'Small stack of worn copper and silver coins, each stamped with a Wedge on the face, one coin standing on its edge beside the stack.'),
        ('G03 GRAVE-GOODS BUNDLE', 'Bundle tied in a scrap of shroud linen, a tarnished brooch, a clay bead string and a bent spoon poking out of the knot.')]),
}

for sid, (title, note, items) in SHEETS.items():
    lines = [COMMON.format(n=len(items)), f'SHEET: title exactly "{title}". {note}', 'CELLS, left to right:']
    lines += [f'{i}. label "{lab}": {d}' for i, (lab, d) in enumerate(items, 1)]
    lines.append('Text: the exact title and the cell labels only; no other text, no watermark.')
    open(os.path.join(HERE, sid + '.desc.txt'), 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
    print(sid, len(items))
