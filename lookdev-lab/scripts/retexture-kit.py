"""Re-encode a prop kit's textures from its source sheet at another size; geometry, names and placements untouched.

The kit scripts (prepare-prop-kit.py, prepare-nature-kits.py, prepare-camp-kits.py) copy each source model's texture
atlas into the kit GLB, resized to their texture size. This swaps those images for the same atlases re-encoded from the
source GLBs, so a kit can be made sharper (or smaller) without splitting the sheet again. Every source image is checked
against the kit image it replaces (PSNR of both at 256 px) before anything is written; a wrong source is refused.

Usage:
  python -I scripts/retexture-kit.py <kit.glb> <source.glb>[:image] [<source.glb>[:image] ...] [--texture 2048] [--dry-run]
        one source per kit image, in the kit's image order; ':image' picks an image inside the source GLB (default 0).

Encoding matches the kit scripts: JPEG quality 88, normal maps 95 (their gradients band at lower quality).
"""
import argparse
import io
import json
import os
import struct

import numpy as np
from PIL import Image

MATCH_DB = 35.0  # kit image vs. resized source; same atlas measures 43-52 dB, another sheet below 26 dB


def read_glb(path):
    with open(path, 'rb') as f:
        data = f.read()
    magic, version, _ = struct.unpack_from('<III', data, 0)
    if magic != 0x46546C67 or version != 2:
        raise SystemExit(f'{path}: not a glTF 2.0 binary')
    off, doc, binary = 12, None, b''
    while off < len(data):
        length, kind = struct.unpack_from('<II', data, off)
        chunk = data[off + 8:off + 8 + length]
        if kind == 0x4E4F534A:
            doc = json.loads(chunk)
        elif kind == 0x004E4942:
            binary = chunk
        off += 8 + length
    return doc, binary


def view_bytes(doc, binary, index):
    view = doc['bufferViews'][index]
    start = view.get('byteOffset', 0)
    return binary[start:start + view['byteLength']]


def image(doc, binary, index):
    return Image.open(io.BytesIO(view_bytes(doc, binary, doc['images'][index]['bufferView'])))


def psnr(a, b):
    a, b = (np.asarray(im.convert('RGB').resize((256, 256), Image.BOX), np.float64) for im in (a, b))
    return 10 * np.log10(255 ** 2 / max(((a - b) ** 2).mean(), 1e-9))


def normal_images(doc):
    """Image indices used as normal maps."""
    textures = doc.get('textures', [])
    return {textures[m['normalTexture']['index']]['source'] for m in doc.get('materials', []) if 'normalTexture' in m}


def write_glb(path, doc, binary, replace):
    """Rewrite the BIN chunk with bufferViews in their original order; `replace` = {bufferView: new bytes}."""
    views = doc['bufferViews']
    blobs, offset = [], 0
    for i in sorted(range(len(views)), key=lambda i: views[i].get('byteOffset', 0)):
        raw = replace.get(i, view_bytes(doc, binary, i))
        pad = (-len(raw)) % 4
        blobs.append(raw + b'\0' * pad)
        views[i]['byteOffset'] = offset
        views[i]['byteLength'] = len(raw)
        offset += len(raw) + pad
    doc['buffers'][0]['byteLength'] = offset
    js = json.dumps(doc, separators=(',', ':')).encode()
    js += b' ' * ((-len(js)) % 4)
    out = b''.join(blobs)
    with open(path, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(out)))
        f.write(struct.pack('<II', len(js), 0x4E4F534A) + js)
        f.write(struct.pack('<II', len(out), 0x004E4942) + out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('kit')
    ap.add_argument('sources', nargs='+', help='<source.glb>[:image], one per kit image in order')
    ap.add_argument('--texture', type=int, default=2048)
    ap.add_argument('--dry-run', action='store_true', help='check the sources and print sizes, write nothing')
    args = ap.parse_args()

    doc, binary = read_glb(args.kit)
    images = doc.get('images', [])
    if len(args.sources) != len(images):
        raise SystemExit(f'{args.kit} has {len(images)} images; give one source each (got {len(args.sources)})')
    normals = normal_images(doc)
    cache, replace = {}, {}
    before = after = 0
    for i, spec in enumerate(args.sources):
        head, _, tail = spec.rpartition(':')
        path, index = (head, int(tail)) if tail.isdigit() else (spec, 0)
        if path not in cache:
            cache[path] = read_glb(path)
        src = image(*cache[path], index)
        old = image(doc, binary, i)
        score = psnr(old, src)
        if score < MATCH_DB:
            raise SystemExit(f'image {i}: {os.path.basename(path)}:{index} does not match the kit texture ({score:.1f} dB < {MATCH_DB} dB)')
        img = src.convert('RGB')
        if img.size != (args.texture, args.texture):
            img = img.resize((args.texture, args.texture), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, 'JPEG', quality=95 if i in normals else 88, optimize=True)
        view = images[i]['bufferView']
        replace[view] = buf.getvalue()
        images[i]['mimeType'] = 'image/jpeg'
        before += doc['bufferViews'][view]['byteLength']
        after += len(replace[view])
        role = 'normal' if i in normals else 'colour/data'
        print(f'image {i} ({role}): {old.size[0]} px -> {args.texture} px from {os.path.basename(path)}:{index} '
              f'({src.size[0]} px, match {score:.1f} dB), {doc["bufferViews"][view]["byteLength"] / 1024:.0f} -> {len(replace[view]) / 1024:.0f} KB')
    if args.dry_run:
        print(f'dry run: textures {before / 1024:.0f} -> {after / 1024:.0f} KB, nothing written')
        return
    write_glb(args.kit, doc, binary, replace)
    print(f'wrote {args.kit} ({os.path.getsize(args.kit) / 1024:.0f} KB, textures {before / 1024:.0f} -> {after / 1024:.0f} KB)')


if __name__ == '__main__':
    main()
