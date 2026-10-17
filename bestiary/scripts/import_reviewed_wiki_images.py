"""Import manually reviewed wiki manifests; never promote download candidates.

Usage: python scripts/import_reviewed_wiki_images.py assets/wiki-pass-*/approved.json
Paths are relative to bestiary. Existing illustrated records are not overwritten.
"""
import base64
import json
import sys
from collections import Counter
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
map_path = root / 'src/data/multiverse-images.json'
source_path = root / 'assets/MULTIVERSE_IMAGE_SOURCES.json'
images = json.loads(map_path.read_text(encoding='utf8'))
sources = json.loads(source_path.read_text(encoding='utf8'))
baseline = json.loads((root / 'assets/missing-wiki-images.json').read_text(encoding='utf8'))
eligible = {r['id'] for r in baseline}
for argument in sys.argv[1:]:
    manifest = root / argument
    for row in json.loads(manifest.read_text(encoding='utf8')):
        key = row['id']
        assert key in eligible, key
        if key in images:
            continue
        assert row['referenceKind'] in ('exact', 'family')
        assert row.get('reviewNote') and row.get('source') and row.get('label'), key
        path = (root / row['file']).resolve()
        assert path.is_relative_to(root), path
        with Image.open(path) as im:
            im.verify()
            mime = Image.MIME[im.format]
        payload = path.read_bytes()
        metadata = {k:v for k,v in row.items() if k not in ('id', 'src')}
        metadata.update(bytes=len(payload), mime=mime, reviewedAt='2026-10-16')
        images[key] = {**metadata, 'src':f'data:{mime};base64,' + base64.b64encode(payload).decode()}
        sources[key] = metadata

map_path.write_text(json.dumps(images, ensure_ascii=False, separators=(',', ':')), encoding='utf8')
source_path.write_text(json.dumps(sources, ensure_ascii=False, indent=2), encoding='utf8')
resolved = [{**row, 'referenceKind':images[row['id']]['referenceKind'], 'source':images[row['id']]['source']} for row in baseline if row['id'] in images]
unresolved = [row for row in baseline if row['id'] not in images]
report = {'reviewedAt':'2026-10-16', 'startingMissing':len(baseline), 'added':len(resolved),
          'addedKinds':dict(Counter(r['referenceKind'] for r in resolved)),
          'crossgameIllustrated':len(images), 'overallIllustrated':len(images)+195,
          'referenceKinds':dict(Counter(r.get('referenceKind') for r in images.values())),
          'resolved':resolved, 'unresolved':unresolved}
(root / 'assets/WIKI_IMAGE_PASS_REPORT.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf8')
print(json.dumps({k:v for k,v in report.items() if k not in ('resolved','unresolved')}))
print('Remaining:',len(unresolved))
