"""Bring the project's 2D concept art into the Book of Cain (D2RR build).

Reads the curated list assets/CONCEPT_SOURCES.json (image paths are relative to
the repository root), writes WebP copies plus thumbnails to assets/concepts/ and
the app data to src/data/concepts.json. assets/concepts/encoded.json records the
SHA-256 of every source PNG; unchanged sources are not re-encoded. The original
PNGs stay where they are.

    python scripts/import_concepts.py [--force]
"""
import argparse
import hashlib
import json
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

from PIL import Image

BESTIARY = Path(__file__).resolve().parents[1]
REPO = BESTIARY.parent
MANIFEST = BESTIARY / 'assets/CONCEPT_SOURCES.json'
OUT = BESTIARY / 'assets/concepts'
LOCK = OUT / 'encoded.json'
DATA = BESTIARY / 'src/data/concepts.json'
FULL_MAX, FULL_QUALITY = 1920, 80  # every current sheet is ≤ 1920 px, so sheets keep native size
THUMB_MAX, THUMB_QUALITY = 480, 68
INDEX_BASE = 4000  # catalog order: after the Dungeon Siege records (3200s)


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def encode(job):
    source, full, thumb, max_size, quality = job
    with Image.open(source) as im:
        im.load()
        im = im.convert('RGBA' if im.mode in ('RGBA', 'LA') or 'transparency' in im.info else 'RGB')
        if im.mode == 'RGBA' and im.getchannel('A').getextrema()[0] == 255:
            im = im.convert('RGB')  # opaque despite the alpha channel
        if max(im.size) > max_size:
            im.thumbnail((max_size, max_size), Image.LANCZOS)
        full.parent.mkdir(parents=True, exist_ok=True)
        im.save(full, 'WEBP', quality=quality, method=6)
        size = im.size
        im.thumbnail((THUMB_MAX, THUMB_MAX), Image.LANCZOS)
        im.save(thumb, 'WEBP', quality=THUMB_QUALITY, method=6)
    return size


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('--force', action='store_true', help='re-encode every image')
    args = parser.parse_args()

    manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
    groups = {g['id']: g for g in manifest['groups']}
    lock = {} if args.force or not LOCK.exists() else json.loads(LOCK.read_text(encoding='utf-8'))
    next_lock, jobs, records = {}, [], []

    for number, record in enumerate(manifest['records'], 1):
        group = groups[record['group']]
        slug = record['id'].removeprefix('concept-')
        images = []
        for n, image in enumerate(record['images']):
            source = REPO / image['origin']
            if not source.is_file():
                raise SystemExit(f'Missing source for {record["id"]}: {image["origin"]}')
            stem = slug if n == 0 else f'{slug}-{n + 1}'
            full = OUT / group['dir'] / f'{stem}.webp'
            thumb = OUT / group['dir'] / f'{stem}.thumb.webp'
            max_size = record.get('maxSize', group.get('maxSize', FULL_MAX))
            quality = record.get('quality', group.get('quality', FULL_QUALITY))
            entry = {'sha256': sha256(source), 'maxSize': max_size, 'quality': quality, 'thumbMax': THUMB_MAX,
                     'file': full.relative_to(BESTIARY).as_posix(),
                     'thumb': thumb.relative_to(BESTIARY).as_posix()}
            cached = lock.get(image['origin'])
            if cached and all(cached.get(k) == v for k, v in entry.items()) and full.exists() and thumb.exists():
                entry.update(width=cached['width'], height=cached['height'])
            else:
                jobs.append((image['origin'], (source, full, thumb, max_size, quality)))
            next_lock[image['origin']] = entry
            images.append({'file': entry['file'], 'thumb': entry['thumb'], 'origin': image['origin'], 'label': image['label']})
        records.append({'id': record['id'], 'index': INDEX_BASE + number, 'number': number,
                        **{k: v for k, v in record.items() if k not in ('id', 'images', 'maxSize', 'quality')}, 'images': images})

    if jobs:
        print(f'Encoding {len(jobs)} images…')
        with ProcessPoolExecutor() as pool:
            for (origin, job), size in zip(jobs, pool.map(encode, [job for _, job in jobs])):
                next_lock[origin].update(width=size[0], height=size[1])
                print(f'  {size[0]}×{size[1]}  {origin}')

    for record in records:
        for image in record['images']:
            image.update(width=next_lock[image['origin']]['width'], height=next_lock[image['origin']]['height'])
        image_files = {i['file'] for i in record['images']} | {i['thumb'] for i in record['images']}
        assert all((BESTIARY / f).is_file() for f in image_files), record['id']

    used = {BESTIARY / e[k] for e in next_lock.values() for k in ('file', 'thumb')}
    for stale in sorted(set(OUT.rglob('*.webp')) - used):
        stale.unlink()
        print('  removed stale', stale.relative_to(BESTIARY).as_posix())
    for e in next_lock.values():
        e['bytes'] = (BESTIARY / e['file']).stat().st_size + (BESTIARY / e['thumb']).stat().st_size

    LOCK.write_text(json.dumps(next_lock, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    data = {'world': manifest['world'],
            'groups': [{k: g[k] for k in ('id', 'name', 'description')} for g in manifest['groups']],
            'records': records}
    DATA.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    total = sum(e['bytes'] for e in next_lock.values())
    print(f'{len(records)} concept records, {len(next_lock)} images, {total / 1024 / 1024:.1f} MB WebP → '
          f'{DATA.relative_to(BESTIARY).as_posix()}')


if __name__ == '__main__':
    main()
