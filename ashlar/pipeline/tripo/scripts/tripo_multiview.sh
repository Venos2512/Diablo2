#!/bin/bash
# Multi-view Smart Mesh for one asset in the pinned tab (CDP_TARGET): opens the generate page, picks Smart Mesh and the
# cube (multi-view) icon, uploads views/front|left|right|back.png one after the other (a filled slot loses its
# <input type=file>, which is the signal that the upload landed), checks Number of Generation = 4, and with --generate
# presses "Generate 100", waits for the mesh and writes the first four variants (uuid + faces) to <asset_dir>/_shots/variants.txt.
# One composite of the four variants (_shots/variants.png, index 0-3 left to right) for picking. Usage: CDP_TARGET=<tab> tripo_multiview.sh <asset_dir> [--generate]
set -e
dir="$1"; gen="$2"
T="$(cd "$(dirname "$0")" && pwd)"
cd "$T"
: "${CDP_TARGET:?set CDP_TARGET to the Tripo tab id}"
export CDP_TARGET
mkdir -p "$dir/_shots" "$dir/_work"  # tripo.log and the other sidecars live in <asset>/_work/
win() { cygpath -w "$1"; }
log() { echo "[$(date +%H:%M:%S)] $*" | tee -a "$dir/_work/tripo.log"; }
credits() { bash step.sh "return (bodyText().match(/Resources\s*99\+\s*(\d+)/) || [])[1] || '?'" | tr -d '"'; }

node cdp.mjs goto https://studio.tripo3d.ai/workspace/generate > /dev/null
bash step.sh "await sleep(2500); await clickButton(/^Smart Mesh/, 1500); return 1" > /dev/null
node cdp.mjs click 167 188 > /dev/null # second icon of the upload box = multi-view (the third is Batch Images to 3D: never)
sleep 1.5
n=0
for slot in Front Left Right Back; do
	f=$(echo "$slot" | tr 'A-Z' 'a-z')
	n=$((n + 1))
	# a slot that is already filled (the page keeps the last uploads across a reload) has no input any more: skip it
	r=$(bash step.sh "const e = [...document.querySelectorAll('input[type=file]')].find((i) => new RegExp('^$slot\\\b').test(norm(i.parentElement.innerText)));
	  if (!e) return 'filled'; e.dataset.slot = '$f'; return 'empty'" | tr -d '"')
	[ "$r" = "filled" ] && continue
	node cdp.mjs upload "input[data-slot=$f]" "$(win "$dir/views/$f.png")" > /dev/null
	# a slot takes ~10 s to load: its blob <img> appears in the upload box when it is done (one upload at a time, parallel ones clobber each other)
	bash step.sh "await waitUntil(() => [...document.querySelectorAll('img')].filter((i) => { const b = i.getBoundingClientRect(); return b.x > 90 && b.x < 300 && b.y > 200 && b.y < 420 && i.src.startsWith('blob:') && i.complete; }).length >= $n, 60000, 500); return 1" > /dev/null
done
state=$(bash step.sh "return norm(findButton(/^Generate\s*100/)?.textContent) || 'Generate still disabled'" | tr -d '"')
log "multi-view slots filled from $dir/views ($state), credits $(credits)"
[ "$gen" = "--generate" ] || exit 0

# Number of Generation = 4 is remembered by the account; press it when the page shows another value
bash step.sh "const b = [...document.querySelectorAll('button')].find((x) => norm(x.textContent) === '4'); if (b) { b.click(); await sleep(500); } return 1" > /dev/null
c0=$(credits)
bash step.sh "await clickButton(/^Generate\s*100/, 4000); return location.pathname" > /dev/null
log "Generate 100 pressed (credits $c0 -> $(credits))"
bash step.sh "await waitUntil(() => /Faces\s*\d+/.test(bodyText()) && !!findButton(/^Export/), 1500000, 2000); await sleep(1500); return location.pathname" | tr -d '"' | tee -a "$dir/_work/tripo.log"
# the four variants are the first four thumbnails of the Assets panel (newest first)
: > "$dir/_shots/variants.txt"
tmp=$(mktemp -d)
for k in 0 1 2 3; do
	r=$(bash step.sh "const thumbs = () => [...document.querySelectorAll('img')].filter((i) => { const b = i.getBoundingClientRect(); return b.x > 1300 && b.width > 60 && b.height > 60; });
	  await waitUntil(() => thumbs().length > $k, 30000, 500);
	  const t = thumbs()[$k]; t.click(); await sleep(3500);
	  await waitUntil(() => /Faces\s*\d+/.test(bodyText()), 30000, 1000).catch(() => 0);
	  return location.pathname.split('/').pop() + ' ' + ((bodyText().match(/Faces\s*(\d+)/) || [])[1] || '?')" | tr -d '"')
	echo "$k $r" | tee -a "$dir/_shots/variants.txt"
	node cdp.mjs shot "$tmp/$k.png" > /dev/null
done
python -I - "$tmp" "$dir/_shots/variants.png" <<'EOF2'
import sys
from PIL import Image
tmp, out = sys.argv[1], sys.argv[2]
box = (330, 60, 1040, 700)
t = [Image.open(f"{tmp}/{k}.png").convert("RGB").crop(box) for k in range(4)]
w, h = t[0].size
s = Image.new("RGB", (w * 4, h))
for k, i in enumerate(t):
    s.paste(i, (k * w, 0))
s.save(out)
EOF2
rm -rf "$tmp"
log "variants (index uuid faces) in _shots/variants.txt"
