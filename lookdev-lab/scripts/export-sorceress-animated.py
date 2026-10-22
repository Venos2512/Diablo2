#!/usr/bin/env python3
"""
Merge a lab Sorceress armour GLB with the shared clip library into one self-contained animated GLB.

Usage: python3 scripts/export-sorceress-animated.py [out dir]   (default: ../exports/sorceress)

Reads assets/samples/d2r-sorceress[-medium|-heavy].glb + d2r-sorceress-anims.glb (same rig, written by
prepare-sorceress.py) and writes <name>-animated.glb with the 52 clips retargeted by bone name.
"""
import importlib.util
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('prepare_kaykit', os.path.join(HERE, 'prepare-kaykit.py'))
kay = importlib.util.module_from_spec(spec)
spec.loader.exec_module(kay)

SAMPLES = os.path.join(HERE, '..', 'assets', 'samples')
TIERS = ('d2r-sorceress', 'd2r-sorceress-medium', 'd2r-sorceress-heavy')


def merge(mesh_path, anim_path, out_path):
    doc, binary = kay.read_glb(mesh_path)
    adoc, abin = kay.read_glb(anim_path)
    by_name = {n.get('name'): i for i, n in enumerate(doc['nodes'])}
    binary = bytearray(binary)
    while len(binary) % 4:
        binary += b'\0'
    base = len(binary)
    binary += abin
    view_map, acc_map = {}, {}
    views = doc.setdefault('bufferViews', [])
    accessors = doc.setdefault('accessors', [])

    def view(i):
        if i not in view_map:
            v = dict(adoc['bufferViews'][i])
            v['buffer'] = 0
            v['byteOffset'] = v.get('byteOffset', 0) + base
            view_map[i] = len(views)
            views.append(v)
        return view_map[i]

    def accessor(i):
        if i not in acc_map:
            a = dict(adoc['accessors'][i])
            if 'bufferView' in a:
                a['bufferView'] = view(a['bufferView'])
            acc_map[i] = len(accessors)
            accessors.append(a)
        return acc_map[i]

    out = []
    for anim in adoc['animations']:
        samplers = [{**s, 'input': accessor(s['input']), 'output': accessor(s['output'])} for s in anim['samplers']]
        channels = []
        for c in anim['channels']:
            name = adoc['nodes'][c['target']['node']].get('name')
            if name not in by_name:
                raise SystemExit(f'bone {name!r} missing in {mesh_path}')
            channels.append({**c, 'target': {**c['target'], 'node': by_name[name]}})
        out.append({**anim, 'samplers': samplers, 'channels': channels})
    doc['animations'] = out
    size = kay.write_glb(out_path, doc, bytes(binary))
    print(f'{out_path}: {len(out)} clips, {size / 1e6:.1f} MB')


def main():
    out_dir = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', '..', 'exports', 'sorceress')
    os.makedirs(out_dir, exist_ok=True)
    anims = os.path.join(SAMPLES, 'd2r-sorceress-anims.glb')
    for tier in TIERS:
        merge(os.path.join(SAMPLES, tier + '.glb'), anims, os.path.join(out_dir, tier + '-animated.glb'))


if __name__ == '__main__':
    main()
