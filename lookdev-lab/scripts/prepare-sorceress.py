#!/usr/bin/env python3
"""
Prepare the Diablo II: Resurrected Sorceress (user-supplied GLB, local reference use) for the lab.

Usage: python3 scripts/prepare-sorceress.py <sorceress.glb> [out dir]

Writes (default out dir: assets/samples):
  d2r-sorceress.glb          light armour  (mesh, skin, textures; no animations)
  d2r-sorceress-medium.glb   medium armour
  d2r-sorceress-heavy.glb    heavy armour
  d2r-sorceress-anims.glb    one shared, pruned animation library (same 181-bone rig for all three)

The source export holds all three armour tiers and both helmet variants stacked in one scene (the game
shows one at a time through render layers, which glTF cannot express) plus 229 clips (21 MB of keys).
Each output keeps the head, hair and one armour tier; the library keeps the clips the lab's controller
uses per weapon stance (idle / walk / run / attack / cast / hit / block ...) with the same key pruning as
prepare-kaykit.py. Clip names stay the original D2 names (<stance>_<action>, see character/clips.js).
"""
import importlib.util
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('prepare_kaykit', os.path.join(HERE, 'prepare-kaykit.py'))
kay = importlib.util.module_from_spec(spec)
spec.loader.exec_module(kay)

# The clips are baked at 60 fps on every bone (face, fingers, hair, skirts): a slightly looser tolerance than the
# KayKit default drops most keys (about 0.2 degrees / 1 mm), which is far below what shows at game camera distance.
kay.TOL.update({'rotation': 2e-3, 'translation': 1e-3, 'scale': 1e-3})

TIERS = {'lit': 'd2r-sorceress', 'med': 'd2r-sorceress-medium', 'hvy': 'd2r-sorceress-heavy'}

# Weapon stances present in the export: hth hand to hand, 1hs / 2hs one / two-handed sword, bow, xbw crossbow, stf staff.
# (1ht / 2ht are the thrust variants of 1hs / 2hs and are left out.)
STANCES = ('hth', '1hs', '2hs', 'bow', 'xbw', 'stf')
ACTIONS = ('neutral', 'walk', 'run', 'attack1', 'attack2', 'cast', 'gethit', 'block', 'kick')
EXTRA = ('hth_death', 'hth_townneutral', 'hth_townwalk', 'stf_townneutral', 'stf_townwalk')


def wanted_clips(doc):
    names = {a['name'] for a in doc['animations']}
    keep = [f'{s}_{a}' for s in STANCES for a in ACTIONS] + list(EXTRA)
    return [n for n in keep if n in names]


def tier_document(doc, binary, tier):
    """Character without animations: head + body + the nodes of one armour tier, unused data compacted."""
    doc = json.loads(json.dumps(doc))
    doc.pop('animations', None)
    scene = doc['scenes'][0]
    kept = []
    for index in scene['nodes']:
        node = doc['nodes'][index]
        d2r = (node.get('extras') or {}).get('d2r') or {}
        if 'mesh' not in node:
            kept.append(index)  # the skeleton root
        elif d2r.get('variant') in ('lit', 'med', 'hvy'):
            if d2r['variant'] == tier:
                kept.append(index)
        elif d2r.get('defaultVisible', True):  # head, hair, brows; the helmets are hidden by default
            kept.append(index)
    scene['nodes'] = kept

    # Compact meshes -> materials -> textures -> images that are still used.
    mesh_ids = sorted({doc['nodes'][i]['mesh'] for i in kept if 'mesh' in doc['nodes'][i]})
    mesh_map = {old: new for new, old in enumerate(mesh_ids)}
    for node in doc['nodes']:
        if 'mesh' in node:
            if node['mesh'] in mesh_map:
                node['mesh'] = mesh_map[node['mesh']]
            else:
                del node['mesh']
                node.pop('skin', None)
    meshes = [doc['meshes'][i] for i in mesh_ids]
    material_ids = sorted({p['material'] for m in meshes for p in m['primitives'] if 'material' in p})
    material_map = {old: new for new, old in enumerate(material_ids)}
    materials = [doc['materials'][i] for i in material_ids]
    for m in meshes:
        for p in m['primitives']:
            if 'material' in p:
                p['material'] = material_map[p['material']]
    texture_ids = []

    def texture(info):
        if info['index'] not in texture_ids:
            texture_ids.append(info['index'])
        info['index'] = texture_ids.index(info['index'])

    for mat in materials:
        pbr = mat.get('pbrMetallicRoughness', {})
        for slot in (pbr.get('baseColorTexture'), pbr.get('metallicRoughnessTexture'), mat.get('normalTexture'), mat.get('occlusionTexture'), mat.get('emissiveTexture')):
            if slot:
                texture(slot)
    textures = [dict(doc['textures'][i]) for i in texture_ids]
    image_ids = []
    for t in textures:
        if t['source'] not in image_ids:
            image_ids.append(t['source'])
        t['source'] = image_ids.index(t['source'])
    images = [dict(doc['images'][i]) for i in image_ids]

    out = kay.Buffer()
    remap = {}

    def acc(i):
        if i not in remap:
            remap[i] = out.copy_accessor(doc, binary, i)
        return remap[i]

    for m in meshes:
        for p in m['primitives']:
            p['attributes'] = {k: acc(v) for k, v in p['attributes'].items()}
            if 'indices' in p:
                p['indices'] = acc(p['indices'])
    for skin in doc['skins']:
        skin['inverseBindMatrices'] = acc(skin['inverseBindMatrices'])
    for image in images:
        view = doc['bufferViews'][image['bufferView']]
        start = view.get('byteOffset', 0)
        image['bufferView'] = out.view(binary[start:start + view['byteLength']])
    doc['meshes'], doc['materials'], doc['textures'], doc['images'] = meshes, materials, textures, images
    doc['accessors'], doc['bufferViews'] = out.accessors, out.views
    doc['asset'] = {**doc.get('asset', {}), 'generator': 'Sanctuary Lookdev Lab · prepare-sorceress.py',
                    'copyright': 'Diablo II: Resurrected Sorceress, (c) Blizzard Entertainment; user-supplied export, local reference only'}
    return doc, bytes(out.data)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    source = sys.argv[1]
    out_dir = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, '..', 'assets', 'samples')
    doc, binary = kay.read_glb(source)
    names = [n['name'] for n in doc['nodes']]
    assert len(set(names)) == len(names), 'node names must be unique so a shared library resolves them'

    for tier, stem in TIERS.items():
        tdoc, data = tier_document(doc, binary, tier)
        target = os.path.join(out_dir, f'{stem}.glb')
        size = kay.write_glb(target, tdoc, data)
        print(f'{os.path.basename(target):28s} {size / 1024:8.1f} KB  ({len(tdoc["meshes"])} meshes, {len(tdoc["images"])} images)')

    keep = wanted_clips(doc)
    sub = json.loads(json.dumps(doc))
    # Keep order (hand to hand first): the lab starts a model on its first clip when no name says idle, and that is hth_neutral.
    by_name = {a['name']: a for a in sub['animations']}
    sub['animations'] = [by_name[n] for n in keep]
    for anim in sub['animations']:
        for sampler in anim['samplers']:
            if sampler.get('interpolation') == 'STEP':
                # Constant channels are exported as one STEP key; with one key STEP and LINEAR are identical.
                assert sub['accessors'][sampler['input']]['count'] == 1, anim['name']
                sampler['interpolation'] = 'LINEAR'
    lib, data, stats = kay.build_library(sub, binary)
    lib['asset']['generator'] = 'Sanctuary Lookdev Lab · prepare-sorceress.py'
    lib['asset']['copyright'] = 'Diablo II: Resurrected Sorceress animations, (c) Blizzard Entertainment; user-supplied export, local reference only'
    target = os.path.join(out_dir, 'd2r-sorceress-anims.glb')
    size = kay.write_glb(target, lib, data)
    print(f'{os.path.basename(target):28s} {size / 1024:8.1f} KB  ({len(lib["animations"])} of {len(doc["animations"])} clips; '
          f'channels {stats["channels_in"]} -> {stats["channels_out"]}, keys {stats["keys_in"]} -> {stats["keys_out"]})')


if __name__ == '__main__':
    main()
