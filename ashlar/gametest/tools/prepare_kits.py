#!/usr/bin/env python
"""Copy the prop kits the game uses into source/assets/ashlar/kits/.

    python -I tools/prepare_kits.py [--samples <repo>/lookdev-lab/assets/samples] [--out source/assets/ashlar/kits]

Reads (read-only)  source/assets/ashlar/kits/config.json  ("kits": { key: "kit-*.glb" })  and  lookdev-lab/assets/samples/<file>
Writes             <out>/<file>   only the kits listed in config.json (others already in <out> are removed)
config.json is hand-edited (piece mapping, scale, yaw, fire anchors, nav): this tool never rewrites it.
It also checks every kit is a plain GLB 2.0 (no required extensions) and that every "piece" the config uses exists in its kit.
"""
import argparse
import json
import shutil
import struct
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def find_repo_root():
    """Walk up from ROOT to the first ancestor that contains lookdev-lab (the project may sit at any depth)."""
    for p in ROOT.parents:
        if (p / 'lookdev-lab').is_dir():
            return p
    return None


def fail(msg):
    print('prepare_kits: ' + msg, file=sys.stderr)
    sys.exit(1)


def glb_json(path):
    b = path.read_bytes()
    magic, version, _ = struct.unpack_from('<4sII', b, 0)
    if magic != b'glTF' or version != 2:
        fail(f'{path.name} is not a GLB 2.0 file')
    n, kind = struct.unpack_from('<I4s', b, 12)
    if kind != b'JSON':
        fail(f'{path.name}: first chunk is not JSON')
    return json.loads(b[20:20 + n])


def main():
    ap = argparse.ArgumentParser()
    repo = find_repo_root()
    ap.add_argument('--samples', default=str(repo / 'lookdev-lab' / 'assets' / 'samples') if repo else None)
    ap.add_argument('--out', default=str(ROOT / 'source' / 'assets' / 'ashlar' / 'kits'))
    a = ap.parse_args()
    if not a.samples:
        fail('cannot find the repo root (an ancestor containing lookdev-lab); pass --samples')
    samples, out = Path(a.samples), Path(a.out)
    cfg = json.loads((out / 'config.json').read_text(encoding='utf-8'))
    kits = cfg['kits']
    names = {}
    total = 0
    for key, file in kits.items():
        src = samples / file
        if not src.is_file():
            fail(f'kit "{key}": {src} not found')
        j = glb_json(src)
        if j.get('extensionsRequired'):
            fail(f'{file}: required glTF extensions are not supported: {j["extensionsRequired"]}')
        names[key] = {n['name'] for n in j['nodes'] if 'mesh' in n}
        shutil.copyfile(src, out / file)
        total += src.stat().st_size
        print(f'  {key:10s} {file:24s} {src.stat().st_size / 1e6:5.2f} MB  {len(names[key])} pieces')
    for old in out.glob('*.glb'):
        if old.name not in kits.values():
            old.unlink()
            print('  removed (not in config.json):', old.name)
    refs = [e['piece'] for kc in cfg['kinds'].values() for e in kc['entries']] + [e['piece'] for w in cfg.get('walls', {}).values() for e in w['pieces']]
    bad = [r for r in refs if r.split('/')[0] not in names or r.split('/')[1] not in names[r.split('/')[0]]]
    if bad:
        fail('config.json references unknown pieces: ' + ', '.join(sorted(set(bad))))
    print(f'{len(kits)} kits, {total / 1e6:.2f} MB, {len(set(refs))} distinct pieces used -> {out}')


if __name__ == '__main__':
    main()
