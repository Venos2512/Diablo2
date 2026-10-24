"""
Act I biome terrain sets: the seamless tiles made by legacy/art-output/terrain-biomes/process.py (Codex-generated, flattened and
cross-faded) -> assets/samples/biome-<biome>-<layer>.webp (albedo) + -h.webp (height, same size: loadPaintedSets reads both per pixel), 512 px, one set of
dirt / mud / grass per biome, loaded by the Terrain scene's "Texture set" list (TERRAIN_SETS in src/env/terrain.js).
Also (re)writes the matching entries in src/assets/samples.json, in place after the terrain3 lines, and prints a
suggested tuftColor per biome (linear, [base, + dry] per channel) from the grass tile's average colour.

  python -I scripts/prepare-terrain-biomes.py
"""
import os
import re

import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC = os.path.join(ROOT, '..', 'legacy', 'art-output', 'terrain-biomes')
OUT = os.path.join(ROOT, 'assets', 'samples')
MANIFEST = os.path.join(ROOT, 'src', 'assets', 'samples.json')
SIZE = 512
BIOMES = ['cold_plains', 'burial_grounds', 'stony_field', 'tristram', 'dark_wood', 'black_marsh', 'tamoe_highland',
          'monastery_courtyard', 'cave', 'catacombs']
LAYERS = {'dirt': 'base', 'mud': 'wet', 'grass': 'cover'}
CREDIT = ('Generated with Codex image generation in the style of the D2R moor tiles (legacy/art-output/terrain-biomes), made tileable '
          'by legacy/art-output/terrain-biomes/process.py and resized by scripts/prepare-terrain-biomes.py')

lines = []
total = 0
for biome in BIOMES:
    slug = biome.replace('_', '-')
    title = biome.replace('_', ' ').title()
    for layer, role in LAYERS.items():
        for suffix, kind in (('', 'albedo'), ('-h', 'height')):
            img = Image.open(os.path.join(SRC, biome, 'seamless', f'{layer}{suffix}.png')).convert('RGB' if not suffix else 'L')
            img = img.resize((SIZE, SIZE), Image.LANCZOS)
            sid = f'biome-{slug}-{layer}{suffix}'
            path = os.path.join(OUT, sid + '.webp')
            img.save(path, 'WEBP', quality=80 if not suffix else 72, method=6)
            total += os.path.getsize(path)
            lines.append(f'    {{"id": "{sid}", "name": "Act I biome · {title} · {role} ({kind})", "kind": "texture", '
                         f'"file": "samples/{sid}.webp", "license": "Project-internal", "credit": "{CREDIT}", '
                         f'"source": "legacy/art-output/terrain-biomes"}},')
    grass = np.asarray(Image.open(os.path.join(SRC, biome, 'seamless', 'grass.png')).convert('RGB'), dtype=np.float32) / 255
    lin = (grass ** 2.2).reshape(-1, 3).mean(0)
    print(f"{biome:20s} tuftColor: [{', '.join(f'[{c * 0.55:.3f}, {c * 0.35:.3f}]' for c in lin)}]")

text = open(MANIFEST, encoding='utf-8').read().split('\n')
text = [l for l in text if '"id": "biome-' not in l]
at = next(i for i, l in enumerate(text) if '"id": "terrain3-water"' in l) + 1  # terrain3-grass-cards may close the list
text[at:at] = lines
with open(MANIFEST, 'w', encoding='utf-8', newline='\n') as f:
    f.write('\n'.join(text))
print(f'{len(lines)} textures, {total / 1048576:.2f} MB, manifest entries written')
