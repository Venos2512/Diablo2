"""
Poly Haven (CC0) ground textures for TERRAIN_SETS.polyhaven: downloads the 2k jpg maps of each chosen asset into
art-output/polyhaven-terrain/<asset>/ (kept, so a rerun does not download again), then writes 1024 px webp files to
assets/samples/ under the lab's names and (re)writes their entries in src/assets/samples.json:

  <name>.webp     albedo (Diffuse)
  <name>-h.webp   height (Displacement)
  <name>-n.webp   normal, OpenGL convention (nor_gl)
  <name>-r.webp   roughness (Rough)

The ground sets use the TERRAIN_SETS layer names (<prefix>-dirt / -mud / -grass).
Palette match: the scans are real-world albedo, far lighter than the lab's Act I palette (the moor grass is ~1/8 of the
scanned grass). Each albedo listed in MATCH is scaled per channel, in linear light, so its mean equals the mean of the lab
tile it replaces (detail and contrast kept, hue and value taken from the palette).
Poly Haven tiles are already seamless; nothing is flattened or cross-faded. Heights are re-centred (mean 0.5, sd 0.16).

  python -I scripts/prepare-terrain-polyhaven.py
"""
import json
import os
import time
import urllib.request

import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
RAW = os.path.join(ROOT, '..', 'art-output', 'polyhaven-terrain')
OUT = os.path.join(ROOT, 'assets', 'samples')
MANIFEST = os.path.join(ROOT, 'src', 'assets', 'samples.json')
SIZE = 1024
# lab name -> (Poly Haven asset id, role)
ASSETS = {
    'ph-moor-dirt': ('brown_mud_02', 'base: dark soil, stones, roots'),
    'ph-moor-mud': ('brown_mud_03', 'wet: mud, wet patches, footprints'),
    'ph-moor-grass': ('forrest_ground_01', 'cover: grass, dead grass, twigs'),
}
# lab name -> the lab tile whose mean colour the scan takes
MATCH = {'ph-moor-dirt': 'terrain3-dirt.png', 'ph-moor-mud': 'terrain3-mud.png', 'ph-moor-grass': 'terrain3-grass.png'}
MAPS = {'': ('Diffuse', 'RGB', 85), '-h': ('Displacement', 'L', 88), '-n': ('nor_gl', 'RGB', 92), '-r': ('Rough', 'L', 85)}
UA = {'User-Agent': 'sanctuary-lookdev-lab/0.1 (texture prep)'}


def fetch(url, path):
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r:
        data = r.read()
    with open(path, 'wb') as f:
        f.write(data)


def save(img, path, quality):
    """PIL save with retries: writes on this drive sometimes fail with EINVAL for a moment."""
    for attempt in range(20):
        try:
            return img.save(path, 'WEBP', quality=quality, method=6)
        except OSError:
            if attempt == 19:
                raise
            time.sleep(0.5)


def linear_mean(img):
    a = np.asarray(img.convert('RGB'), dtype=np.float32) / 255
    return (a ** 2.2).reshape(-1, 3).mean(0)


def matched(img, target_file):
    """img scaled per channel (linear) so its mean is the target tile's mean."""
    a = (np.asarray(img, dtype=np.float32) / 255) ** 2.2
    scale = linear_mean(Image.open(os.path.join(OUT, target_file))) / a.reshape(-1, 3).mean(0)
    out = np.clip(a * scale, 0, 1) ** (1 / 2.2)
    return Image.fromarray((out * 255 + 0.5).astype(np.uint8)), scale


lines = []
for name, (asset, role) in ASSETS.items():
    folder = os.path.join(RAW, asset)
    os.makedirs(folder, exist_ok=True)
    with urllib.request.urlopen(urllib.request.Request(f'https://api.polyhaven.com/files/{asset}', headers=UA), timeout=60) as r:
        files = json.load(r)
    with urllib.request.urlopen(urllib.request.Request(f'https://api.polyhaven.com/info/{asset}', headers=UA), timeout=60) as r:
        info = json.load(r)
    authors = ', '.join(info.get('authors', {}).keys()) or 'Poly Haven'
    size_m = info.get('dimensions', [0])[0] / 1000
    for suffix, (key, mode, quality) in MAPS.items():
        url = files[key]['2k']['jpg']['url']
        raw = os.path.join(folder, os.path.basename(url))
        fetch(url, raw)
        img = Image.open(raw).convert(mode).resize((SIZE, SIZE), Image.LANCZOS)
        if suffix == '-h':
            # Displacement is in each scan's own range: centre on 0.5 with a common spread so the layers' height blend
            # (which compares heights across layers) is not won by whichever scan happens to sit higher.
            h = np.asarray(img, dtype=np.float32) / 255
            h = 0.5 + (h - h.mean()) / max(h.std(), 1e-3) * 0.16
            img = Image.fromarray((np.clip(h, 0, 1) * 255 + 0.5).astype(np.uint8))
        sid = f'{name}{suffix}'
        kind = {'': 'albedo', '-h': 'height', '-n': 'normal', '-r': 'roughness'}[suffix]
        if suffix == '' and name in MATCH:
            img, scale = matched(img, MATCH[name])
            kind = 'albedo, Act I palette'
            print(f'  {name}: palette scale {scale.round(2)}')
        save(img, os.path.join(OUT, sid + '.webp'), quality)
        lines.append(f'    {{"id": "{sid}", "name": "Poly Haven · {info.get("name", asset)} ({kind})", "kind": "texture", '
                     f'"file": "samples/{sid}.webp", "license": "CC0-1.0", "credit": "{info.get("name", asset)} by {authors}, Poly Haven '
                     f'(https://polyhaven.com/a/{asset}), resized by scripts/prepare-terrain-polyhaven.py", "source": "https://polyhaven.com/a/{asset}"}},')
    print(f'{name}: {asset} ({size_m:.2f} m, {authors}) — {role}')

text = open(MANIFEST, encoding='utf-8').read().split('\n')
text = [l for l in text if '"id": "ph-' not in l]
at = max(i for i, l in enumerate(text) if '"id": "biome-' in l) + 1
text[at:at] = lines
for attempt in range(20):
    try:
        with open(MANIFEST, 'w', encoding='utf-8', newline='\n') as f:
            f.write('\n'.join(text))
        break
    except OSError:
        time.sleep(0.5)
print(f'{len(lines)} textures written, manifest updated')
