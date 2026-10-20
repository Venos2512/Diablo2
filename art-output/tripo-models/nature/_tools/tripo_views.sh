#!/bin/bash
# One image for the final review: the model open in the pinned tab (CDP_TARGET) from front, 3/4, side and back, as a 2x2
# sheet cropped to the viewer. Reloads the model page (front view), orbits with left-button drags (~0.43 deg per px).
# Usage: CDP_TARGET=<tab> tripo_views.sh <model_uuid> <out.png>
set -e
id="$1"; out="$2"
cd "$(dirname "$0")"
: "${CDP_TARGET:?set CDP_TARGET to the Tripo tab id}"
export CDP_TARGET
tmp=$(mktemp -d)
node cdp.mjs goto "https://studio.tripo3d.ai/workspace/generate/$id" > /dev/null
bash step.sh "await waitUntil(() => /Faces\s*\d+/.test(bodyText()), 60000, 1000); await sleep(3000); return 1" > /dev/null
node cdp.mjs shot "$tmp/0.png" > /dev/null
for k in 1 2 3; do
	case $k in 1) d=105 ;; 2) d=105 ;; 3) d=210 ;; esac # cumulative 45, 90, 180 degrees
	node cdp.mjs drag 500,640 $((500 + d)),640 > /dev/null
	sleep 1
	node cdp.mjs shot "$tmp/$k.png" > /dev/null
done
python -I - "$tmp" "$out" <<'EOF'
import sys
from PIL import Image
tmp, out = sys.argv[1], sys.argv[2]
box = (330, 60, 1120, 700)  # viewer area of a 1384x805 shot, clear of the side panels
tiles = [Image.open(f"{tmp}/{k}.png").convert("RGB").crop(box) for k in range(4)]
w, h = tiles[0].size
sheet = Image.new("RGB", (w * 2, h * 2))
for k, t in enumerate(tiles):
    sheet.paste(t, ((k % 2) * w, (k // 2) * h))
sheet.save(out)
EOF
rm -rf "$tmp"
echo "$out"
