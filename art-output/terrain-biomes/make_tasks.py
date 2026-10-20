# Writes one Codex CLI task per biome: three square seamless ground tiles (base / wet / cover) that map onto the
# lab's terrain splat layers dirt / mud / grass. Style refs: the approved D2R moor tiles (grass_a, dirt_dry).
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = 'E:/Diablo2/art-output/terrain-biomes'

COMMON = (
    "strictly orthographic top-down view straight down at the ground, painterly-realistic style matching the attached reference tiles "
    "(Diablo II Resurrected-like dark fantasy, Act I), low detail: large readable shapes and soft value changes, no fine noisy grain, "
    "flat even lighting, no cast shadows, no light gradient, no vignette, no perspective, no horizon, no characters, no items, no text, "
    "nothing large or special touching the edges, even density and even average brightness over the whole tile, about 3.5 metres of ground in the frame"
)

# biome: (palette note, [(file, prompt)...]) - file names follow the lab's splat layers.
BIOMES = {
    'cold_plains': ("cold grey-green, main colour about #46504A, desaturated, cold", [
        ('dirt', "seamless tileable texture, cold hard-packed grey-brown soil with small flat pebbles and a few dry pale grass bits"),
        ('mud', "seamless tileable texture, cold dark grey mud with three or four small shallow puddles of still water that read cold blue-grey, softened footprints"),
        ('grass', "seamless tileable texture, short sparse cold grey-green plains grass, thin wiry blades lying in mixed directions, frost-dried pale tips, a little bare soil showing")]),
    'burial_grounds': ("night blue-grey, main colour about #2E3540, very dark, cold", [
        ('dirt', "seamless tileable texture, dark loose graveyard soil, freshly turned dark earth with clods, scattered dead brown leaves"),
        ('mud', "seamless tileable texture, black-brown waterlogged graveyard mud with small dark puddles reflecting cold blue-grey"),
        ('grass', "seamless tileable texture, sickly dead blue-grey graveyard grass, long matted blades, wilted, with fallen dead leaves")]),
    'stony_field': ("stone brown, main colour about #5A5040, warm grey-brown", [
        ('dirt', "seamless tileable texture, rocky field ground: brown gravel soil with many embedded flat stones and broken rock pieces of mixed sizes, all small"),
        ('mud', "seamless tileable texture, wet muddy gravel with stones half sunk in brown mud and small shallow puddles"),
        ('grass', "seamless tileable texture, sparse dry olive-brown grass growing between small stones and gravel, grass covering about 60 percent")]),
    'tristram': ("ash, main colour about #2A2420, dark charcoal-brown with grey ash", [
        ('dirt', "seamless tileable texture, burned village ground covered in grey ash and soot, small charcoal bits and burned wood splinters"),
        ('mud', "seamless tileable texture, sooty black mud mixed with wet ash, small dark grey puddles with an ashy film"),
        ('grass', "seamless tileable texture, scorched burned grass: blackened and singed blades mixed with a few surviving dull green-olive ones, grey ash between")]),
    'dark_wood': ("deep forest green, main colour about #1E2A1C, very dark", [
        ('dirt', "seamless tileable texture, dark forest floor: dark loam with fallen pine needles, dead leaves and a few thin roots, all lying flat"),
        ('mud', "seamless tileable texture, wet dark forest mud with moss patches and small black puddles, rotten leaves"),
        ('grass', "seamless tileable texture, dark green moss and low shade grass covering the forest floor with scattered dead leaves, deep green, damp")]),
    'black_marsh': ("marsh mud green, main colour about #2C3326, murky with grey mist tones #7A8070", [
        ('dirt', "seamless tileable texture, dark peat bog soil, spongy brown-black peat with matted dead reed stems lying flat"),
        ('mud', "seamless tileable texture, marsh sludge: dark olive-black mud with several larger patches of murky green-brown standing water, a little floating scum"),
        ('grass', "seamless tileable texture, dense wet marsh grass and flattened reeds, dark olive-green with yellow-brown dead stalks")]),
    'tamoe_highland': ("stone grey, main colour about #555248, cool grey with olive", [
        ('dirt', "seamless tileable texture, highland ground of grey stony soil and broken slate chips with pale lichen spots"),
        ('mud', "seamless tileable texture, wet dark grey slate scree and mud with small cold puddles between flat wet rocks"),
        ('grass', "seamless tileable texture, short tough wiry highland grass with low heather tufts in dull olive and muted purple-brown, some grey stones")]),
    'monastery_courtyard': ("monastery stone, main colour about #5C5246, warm worn grey-beige", [
        ('dirt', "seamless tileable texture, old worn flagstone paving of a monastery courtyard, irregular rectangular stone slabs with dark joints, chipped edges, the slab grid must tile seamlessly"),
        ('mud', "seamless tileable texture, the same worn flagstone paving, wet and dirty with mud in the joints and a few small shallow puddles on the slabs"),
        ('grass', "seamless tileable texture, broken overgrown flagstone paving: dull green grass and moss growing out of the joints and covering about half of the slabs")]),
    'cave': ("cave earth brown-grey, main colour about #3A332C, dark", [
        ('dirt', "seamless tileable texture, cave floor of packed dry earth and rock, small loose stones, a few cracks"),
        ('mud', "seamless tileable texture, wet cave floor: dark damp rock and clay with small still puddles reflecting faint grey"),
        ('grass', "seamless tileable texture, cave floor covered with gravel scree and pebbles of grey-brown rock, a few small pale fungus spots")]),
    'catacombs': ("red-brown, main colour about #2A1414, dark, accents of blood #8A1010", [
        ('dirt', "seamless tileable texture, old catacomb stone floor of worn square stone tiles with dark joints and dust, the tile grid must tile seamlessly"),
        ('mud', "seamless tileable texture, the same catacomb stone floor stained with dark dried and wet blood pools, deep red-brown, glossy wet parts"),
        ('grass', "seamless tileable texture, catacomb floor strewn with rubble, dust and scattered small bone fragments, sparse, no skulls")]),
}

if __name__ == '__main__':
    for biome, (palette, tiles) in BIOMES.items():
        os.makedirs(os.path.join(HERE, biome), exist_ok=True)
        lines = [
            "Use your built-in image generation tool to create THREE separate square 1:1 images (one image generation call per image). "
            "Do not draw with code, do not use procedural generation, do not run codex. If image generation is not available, stop and say so.",
            "Reference images 1 and 2 are approved ground tiles of our game (a moor grass tile and a dry dirt tile): match their rendering style, "
            "scale, low detail level and flat lighting, but NOT their colours.",
            f"Biome: {biome.replace('_', ' ')}. Palette: {palette}.",
        ]
        for i, (name, prompt) in enumerate(tiles, 1):
            lines.append(f"Image {i}: save as {OUT}/{biome}/{name}.png - prompt: {prompt}, {COMMON}.")
        lines.append("Copy each image to its path right after it is generated (PNG). Do not touch any other file. "
                     "At the end, list the saved paths and, for each, one line on how seamless it looks.")
        with open(os.path.join(HERE, biome + '.task.txt'), 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines) + '\n')
    print(len(BIOMES), 'tasks')
