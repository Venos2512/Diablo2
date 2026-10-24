#!/usr/bin/env python3
"""
Prepare the KayKit Adventurers 1.0 samples (CC0, Kay Lousberg) for the lab.

Usage: python3 scripts/prepare-kaykit.py <path to kaykit_character_pack_adventures> [out dir]

Writes (default out dir: assets/samples):
  kaykit-<name>.glb        character without animations (rig, skinned meshes, built-in weapons, texture)
  kaykit-anims-medium.glb  animation library shared by Knight / Barbarian / Mage (identical rig + clips)
  kaykit-anims-rogue.glb   animation library of the Rogue rig
  kaykit-props.glb         weapons and shields as separate named nodes

The raw character files repeat the same 76 clips (3.6 MB each, mostly JSON). The libraries keep one copy
per rig and drop what three.js does not need: channels of IK / roll control bones (no skin weights),
channels that stay at the rest pose (the mixer restores it), and keys a linear interpolation reproduces;
rotations are stored as normalized 16-bit integers (allowed by glTF 2.0 for rotation outputs).
"""
import json
import os
import struct
import sys
from array import array

COMP = {5120: ('b', 1), 5121: ('B', 1), 5122: ('h', 2), 5123: ('H', 2), 5125: ('I', 4), 5126: ('f', 4)}
NCOMP = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT2': 4, 'MAT3': 9, 'MAT4': 16}
CONTROL_PREFIXES = ('kneeIK', 'elbowIK', 'handIK', 'heelIK', 'IK-', 'control-')
REST = {'translation': [0, 0, 0], 'rotation': [0, 0, 0, 1], 'scale': [1, 1, 1]}
TOL = {'translation': 1e-4, 'rotation': 2e-4, 'scale': 1e-4}


# ------------------------------------------------------------------------------------------------ io

def read_glb(path):
    data = open(path, 'rb').read()
    magic, _version, length = struct.unpack('<4sII', data[:12])
    assert magic == b'glTF', path
    offset, doc, binary = 12, None, b''
    while offset < length:
        chunk_length, chunk_type = struct.unpack('<II', data[offset:offset + 8])
        chunk = data[offset + 8:offset + 8 + chunk_length]
        if chunk_type == 0x4E4F534A:
            doc = json.loads(chunk)
        elif chunk_type == 0x004E4942:
            binary = chunk
        offset += 8 + chunk_length
    return doc, binary


def read_gltf(path):
    doc = json.load(open(path))
    base = os.path.dirname(path)
    binary = open(os.path.join(base, doc['buffers'][0]['uri']), 'rb').read()
    return doc, binary, base


def write_glb(path, doc, binary):
    while len(binary) % 4:
        binary += b'\0'
    doc['buffers'] = [{'byteLength': len(binary)}] if binary else []
    text = json.dumps(doc, separators=(',', ':')).encode()
    while len(text) % 4:
        text += b' '
    total = 12 + 8 + len(text) + (8 + len(binary) if binary else 0)
    with open(path, 'wb') as f:
        f.write(struct.pack('<4sII', b'glTF', 2, total))
        f.write(struct.pack('<II', len(text), 0x4E4F534A))
        f.write(text)
        if binary:
            f.write(struct.pack('<II', len(binary), 0x004E4942))
            f.write(binary)
    return total


def accessor_values(doc, binary, index):
    acc = doc['accessors'][index]
    fmt, size = COMP[acc['componentType']]
    n = NCOMP[acc['type']]
    view = doc['bufferViews'][acc['bufferView']]
    if view.get('byteStride') and view['byteStride'] != size * n:
        raise ValueError('interleaved accessors are not supported')
    start = view.get('byteOffset', 0) + acc.get('byteOffset', 0)
    values = array(fmt)
    values.frombytes(binary[start:start + acc['count'] * size * n])
    return values, n


class Buffer:
    """Accumulates buffer views / accessors for a new document."""

    def __init__(self):
        self.data = bytearray()
        self.views = []
        self.accessors = []
        self._dedup = {}

    def view(self, raw, target=None, stride=None):
        while len(self.data) % 4:
            self.data.append(0)
        entry = {'buffer': 0, 'byteOffset': len(self.data), 'byteLength': len(raw)}
        if target:
            entry['target'] = target
        if stride:
            entry['byteStride'] = stride
        self.data += raw
        self.views.append(entry)
        return len(self.views) - 1

    def accessor(self, values, component, kind, minmax=False, dedup=False, **extra):
        raw = values.tobytes()
        key = (raw, component, kind) if dedup else None
        if key is not None and key in self._dedup:
            return self._dedup[key]
        n = NCOMP[kind]
        acc = {'bufferView': self.view(raw), 'componentType': component, 'count': len(values) // n, 'type': kind, **extra}
        if minmax:
            acc['min'] = [min(values[i::n]) for i in range(n)]
            acc['max'] = [max(values[i::n]) for i in range(n)]
        self.accessors.append(acc)
        index = len(self.accessors) - 1
        if key is not None:
            self._dedup[key] = index
        return index

    def copy_accessor(self, doc, binary, index):
        """Copy an accessor (and its data) from another document, keeping every field."""
        acc = dict(doc['accessors'][index])
        view = doc['bufferViews'][acc['bufferView']]
        fmt, size = COMP[acc['componentType']]
        n = NCOMP[acc['type']]
        start = view.get('byteOffset', 0) + acc.get('byteOffset', 0)
        raw = binary[start:start + acc['count'] * size * n]
        acc['bufferView'] = self.view(raw, view.get('target'))
        acc.pop('byteOffset', None)
        self.accessors.append(acc)
        return len(self.accessors) - 1


# ------------------------------------------------------------------------------------ characters

def strip_animations(doc, binary):
    """Character without its animations: meshes, skin, rig and texture only."""
    out = Buffer()
    doc = json.loads(json.dumps(doc))
    doc.pop('animations', None)
    remap = {}

    def acc(index):
        if index not in remap:
            remap[index] = out.copy_accessor(doc, binary, index)
        return remap[index]

    for mesh in doc['meshes']:
        for prim in mesh['primitives']:
            prim['attributes'] = {k: acc(v) for k, v in prim['attributes'].items()}
            if 'indices' in prim:
                prim['indices'] = acc(prim['indices'])
            if 'targets' in prim:
                prim['targets'] = [{k: acc(v) for k, v in t.items()} for t in prim['targets']]
    for skin in doc.get('skins', []):
        if 'inverseBindMatrices' in skin:
            skin['inverseBindMatrices'] = acc(skin['inverseBindMatrices'])
    for image in doc.get('images', []):
        if 'bufferView' in image:
            view = doc['bufferViews'][image['bufferView']]
            start = view.get('byteOffset', 0)
            image['bufferView'] = out.view(binary[start:start + view['byteLength']])
    doc['accessors'] = out.accessors
    doc['bufferViews'] = out.views
    return doc, bytes(out.data)


# ------------------------------------------------------------------------------------ animations

def is_control(name):
    return name.startswith(CONTROL_PREFIXES)


def same(a, b, tol, quaternion):
    if quaternion and sum(x * y for x, y in zip(a, b)) < 0:
        b = [-x for x in b]
    return all(abs(x - y) <= tol for x, y in zip(a, b))


def reduce_linear(times, values, n, tol, quaternion):
    """Drop keys that linear interpolation between the kept neighbours reproduces (checked for every
    dropped key, so the error cannot accumulate along a smooth curve)."""
    count = len(times)
    if count <= 2:
        return list(range(count))
    keep = [0]
    for i in range(1, count - 1):
        a, b = keep[-1], i + 1
        va = values[a * n:(a + 1) * n]
        vb = values[b * n:(b + 1) * n]
        if quaternion and sum(x * y for x, y in zip(va, vb)) < 0:
            keep.append(i)
            continue
        ok = True
        for k in range(a + 1, b):
            t = (times[k] - times[a]) / max(times[b] - times[a], 1e-9)
            pred = [x + (y - x) * t for x, y in zip(va, vb)]
            if quaternion:
                length = sum(x * x for x in pred) ** 0.5 or 1
                pred = [x / length for x in pred]
            if not same(pred, values[k * n:(k + 1) * n], TOL['rotation' if quaternion else 'translation'], quaternion):
                ok = False
                break
        if not ok:
            keep.append(i)
    keep.append(count - 1)
    return keep


def build_library(doc, binary):
    """Bone hierarchy + pruned animations, no meshes."""
    nodes = doc['nodes']
    joints = set(doc['skins'][0]['joints'])
    parent = {c: i for i, n in enumerate(nodes) for c in n.get('children', [])}
    keep_nodes = [i for i in range(len(nodes)) if i in joints and not is_control(nodes[i]['name'])]
    # Ancestors that are not joints (the armature node, "Rig") stay so the hierarchy matches.
    for i in list(keep_nodes):
        p = parent.get(i)
        while p is not None:
            if p not in keep_nodes:
                keep_nodes.append(p)
            p = parent.get(p)
    keep_nodes.sort()
    index = {old: new for new, old in enumerate(keep_nodes)}
    out_nodes = []
    for old in keep_nodes:
        node = {k: v for k, v in nodes[old].items() if k not in ('mesh', 'skin', 'children')}
        children = [index[c] for c in nodes[old].get('children', []) if c in index]
        if children:
            node['children'] = children
        out_nodes.append(node)
    roots = [index[i] for i in keep_nodes if parent.get(i) not in index]

    out = Buffer()
    animations = []
    stats = {'channels_in': 0, 'channels_out': 0, 'keys_in': 0, 'keys_out': 0}
    for anim in doc['animations']:
        end = 0.0
        for ch in anim['channels']:
            times, _ = accessor_values(doc, binary, anim['samplers'][ch['sampler']]['input'])
            end = max(end, times[-1])
        channels, samplers = [], []
        for ch in anim['channels']:
            stats['channels_in'] += 1
            node_index = ch['target']['node']
            if node_index not in index:
                continue
            path = ch['target']['path']
            sampler = anim['samplers'][ch['sampler']]
            if sampler.get('interpolation', 'LINEAR') != 'LINEAR':
                raise ValueError('only LINEAR samplers are handled')
            times, _ = accessor_values(doc, binary, sampler['input'])
            values, n = accessor_values(doc, binary, sampler['output'])
            stats['keys_in'] += len(times)
            quaternion = path == 'rotation'
            rest = nodes[node_index].get(path, REST[path])
            keys = [values[k * n:(k + 1) * n] for k in range(len(times))]
            if all(same(k, rest, TOL[path], quaternion) for k in keys):
                continue  # never leaves the rest pose: the mixer restores it
            if all(same(k, keys[0], TOL[path], quaternion) for k in keys):
                kept_times = array('f', [0.0, end])  # constant: two keys keep the clip length
                kept_values = array('f', list(keys[0]) * 2)
            else:
                kept = reduce_linear(times, values, n, TOL[path], quaternion)
                kept_times = array('f', [times[k] for k in kept])
                kept_values = array('f', [v for k in kept for v in keys[k]])
            stats['keys_out'] += len(kept_times)
            stats['channels_out'] += 1
            if quaternion:
                # glTF allows normalized SHORT rotation outputs (three.js rescales them): half the bytes,
                # 1/32767 precision.
                quantized = array('h', [max(-32767, min(32767, round(v * 32767))) for v in kept_values])
                output = out.accessor(quantized, 5122, 'VEC4', normalized=True)
            else:
                output = out.accessor(kept_values, 5126, 'VEC3')
            samplers.append({
                'input': out.accessor(kept_times, 5126, 'SCALAR', minmax=True, dedup=True),
                'output': output,
                'interpolation': 'LINEAR',
            })
            channels.append({'sampler': len(samplers) - 1, 'target': {'node': index[node_index], 'path': path}})
        if not channels or max(out.accessors[s['input']]['max'][0] for s in samplers) < end - 1e-6:
            # Keep the clip length (poses, or clips whose last keys were all redundant).
            root = roots[0]
            samplers.append({
                'input': out.accessor(array('f', [0.0, end]), 5126, 'SCALAR', minmax=True, dedup=True),
                'output': out.accessor(array('f', out_nodes[root].get('rotation', [0, 0, 0, 1]) * 2), 5126, 'VEC4'),
                'interpolation': 'LINEAR',
            })
            channels.append({'sampler': len(samplers) - 1, 'target': {'node': root, 'path': 'rotation'}})
        animations.append({'name': anim['name'], 'channels': channels, 'samplers': samplers})

    lib = {
        'asset': {'version': '2.0', 'generator': 'Sanctuary Lookdev Lab · prepare-kaykit.py', 'copyright': 'KayKit Adventurers 1.0 by Kay Lousberg (CC0)'},
        'scene': 0,
        'scenes': [{'name': 'AnimationLibrary', 'nodes': roots}],
        'nodes': out_nodes,
        'animations': animations,
        'accessors': out.accessors,
        'bufferViews': out.views,
    }
    return lib, bytes(out.data), stats


# ----------------------------------------------------------------------------------------- props

def merge_props(entries):
    """entries: [(node name, .gltf path)] -> one document, one root node per prop."""
    out = Buffer()
    doc = {
        'asset': {'version': '2.0', 'generator': 'Sanctuary Lookdev Lab · prepare-kaykit.py', 'copyright': 'KayKit Adventurers 1.0 by Kay Lousberg (CC0)'},
        'scene': 0, 'scenes': [{'name': 'Props', 'nodes': []}], 'nodes': [], 'meshes': [], 'materials': [],
        'textures': [], 'images': [], 'samplers': [{'magFilter': 9729, 'minFilter': 9987}],
    }
    material_by_image = {}
    for name, path in entries:
        src, binary, base = read_gltf(path)
        assert len(src['meshes']) == 1 and len(src['nodes']) == 1, path
        image = src['images'][0]
        key = image['uri']
        if key not in material_by_image:
            raw = open(os.path.join(base, image['uri']), 'rb').read()
            doc['images'].append({'name': image.get('name', key), 'mimeType': image.get('mimeType', 'image/png'), 'bufferView': out.view(raw)})
            doc['textures'].append({'sampler': 0, 'source': len(doc['images']) - 1})
            material = json.loads(json.dumps(src['materials'][0]))
            material['pbrMetallicRoughness']['baseColorTexture'] = {'index': len(doc['textures']) - 1}
            doc['materials'].append(material)
            material_by_image[key] = len(doc['materials']) - 1
        mesh = json.loads(json.dumps(src['meshes'][0]))
        mesh['name'] = name
        for prim in mesh['primitives']:
            prim['attributes'] = {k: out.copy_accessor(src, binary, v) for k, v in prim['attributes'].items()}
            if 'indices' in prim:
                prim['indices'] = out.copy_accessor(src, binary, prim['indices'])
            prim['material'] = material_by_image[key]
        doc['meshes'].append(mesh)
        doc['nodes'].append({'name': name, 'mesh': len(doc['meshes']) - 1})
        doc['scenes'][0]['nodes'].append(len(doc['nodes']) - 1)
    doc['accessors'] = out.accessors
    doc['bufferViews'] = out.views
    return doc, bytes(out.data)


PROPS = [
    'sword_1handed', 'sword_2handed', 'axe_1handed', 'axe_2handed', 'dagger', 'staff', 'wand',
    'crossbow_1handed', 'crossbow_2handed', 'shield_round', 'shield_square', 'shield_spikes', 'shield_badge', 'spellbook_open',
]


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    pack = sys.argv[1]
    out_dir = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), '..', 'assets', 'samples')
    chars = os.path.join(pack, 'Characters', 'gltf')
    sizes = []
    for name in ('Knight', 'Barbarian', 'Mage', 'Rogue'):
        doc, binary = read_glb(os.path.join(chars, f'{name}.glb'))
        stripped, data = strip_animations(doc, binary)
        target = os.path.join(out_dir, f'kaykit-{name.lower()}.glb')
        sizes.append((target, write_glb(target, stripped, data), os.path.getsize(os.path.join(chars, f'{name}.glb'))))
    for rig, source in (('medium', 'Knight'), ('rogue', 'Rogue')):
        doc, binary = read_glb(os.path.join(chars, f'{source}.glb'))
        lib, data, stats = build_library(doc, binary)
        target = os.path.join(out_dir, f'kaykit-anims-{rig}.glb')
        sizes.append((target, write_glb(target, lib, data), None))
        print(f'{rig}: {len(lib["animations"])} clips · channels {stats["channels_in"]} -> {stats["channels_out"]} · keys {stats["keys_in"]} -> {stats["keys_out"]}')
    props, data = merge_props([(p, os.path.join(pack, 'Assets', 'gltf', f'{p}.gltf')) for p in PROPS])
    target = os.path.join(out_dir, 'kaykit-props.glb')
    sizes.append((target, write_glb(target, props, data), None))
    for path, size, before in sizes:
        print(f'{os.path.basename(path):26s} {size / 1024:8.1f} KB' + (f'  (was {before / 1024:.0f} KB)' if before else ''))


if __name__ == '__main__':
    main()
