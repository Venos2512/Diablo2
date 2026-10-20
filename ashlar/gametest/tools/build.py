#!/usr/bin/env python
"""Build one self-contained HTML file from source/.

    python -I tools/build.py [--source source] [--out dist/gametest.html]

- css/style.css                 -> inline <style>
- js/manifest.json files        -> ONE inline <script type="module"> (concatenated in order, the same way tools/serve.mjs does)
- fonts/*.woff2                 -> data URIs where the JS references `fonts/<name>.woff2`
- assets/ashlar/terrain/*       -> `var __ASHLAR_INLINE = { "<relative path>": "data:...", ... }` before the module code;
  assets/ashlar/kits/*             js/ashlar-terrain.js and js/ashlar-kits.js read it instead of fetching URLs (works from file://, no network)
Building a source tree that has no assets/ashlar/ (e.g. a fresh `unpack.py --out tmp`) gives the plain original game.
"""
import argparse
import base64
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MIME = {'.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary'}


def die(msg):
    print('build: ' + msg, file=sys.stderr)
    sys.exit(1)


def data_uri(path):
    return f'data:{MIME[path.suffix]};base64,' + base64.b64encode(path.read_bytes()).decode('ascii')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--source', default=str(ROOT / 'source'))
    ap.add_argument('--out', default=str(ROOT / 'dist' / 'gametest.html'))
    a = ap.parse_args()
    src, out = Path(a.source), Path(a.out)

    manifest = json.loads((src / 'js' / 'manifest.json').read_text(encoding='utf-8'))['files']
    js = '\n'.join((src / f).read_text(encoding='utf-8') for f in manifest)

    # fonts
    used = set(re.findall(r'`fonts/([\w.-]+\.woff2)`', js))
    for name in sorted(used):
        f = src / 'fonts' / name
        if not f.exists():
            die(f'font referenced but missing: {f}')
        js = js.replace(f'`fonts/{name}`', f'`{data_uri(f)}`')
    if re.search(r'`fonts/', js):
        die('unresolved font reference')

    # ASHLAR assets
    prelude = ''
    files = {}
    for sub in ('terrain', 'kits'):
        adir = src / 'assets' / 'ashlar' / sub
        if adir.is_dir():
            files.update({f'assets/ashlar/{sub}/{p.name}': data_uri(p) for p in sorted(adir.iterdir()) if p.suffix in MIME})
    n_assets = len(files)
    if files:
        prelude = '// [ASHLAR] inlined terrain / kit assets (tools/build.py); js/ashlar-terrain.js and js/ashlar-kits.js prefer these over fetching URLs\nvar __ASHLAR_INLINE = ' + json.dumps(files, separators=(',', ':')) + ';\n'

    if '</script' in js.lower() or '</script' in prelude.lower():
        js = re.sub(r'</script', r'<\\/script', js, flags=re.I)
        prelude = re.sub(r'</script', r'<\\/script', prelude, flags=re.I)

    # HTML shell
    html = (src / 'index.html').read_text(encoding='utf-8')
    css = (src / 'css' / 'style.css').read_text(encoding='utf-8')
    link = '<link rel="stylesheet" href="css/style.css">'
    tag = re.search(r'<!--[^>]*?js/bundle\.js[^>]*?-->\s*<script type="module" src="js/bundle\.js"></script>', html, re.S) or \
        re.search(r'<script type="module" src="js/bundle\.js"></script>', html)
    if html.count(link) != 1 or not tag:
        die('index.html does not have the expected stylesheet link / bundle script tag')
    html = html[:tag.start()] + '<script type="module">' + prelude + js + '</script>' + html[tag.end():]
    html = html.replace(link, '<style>' + css + '</style>')

    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding='utf-8')
    print(f'wrote {out} ({out.stat().st_size / 1e6:.2f} MB): {len(manifest)} js files, {len(used)} fonts, {n_assets} ashlar assets (terrain + kits)')


if __name__ == '__main__':
    main()
