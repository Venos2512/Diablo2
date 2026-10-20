#!/bin/bash
# Full Tripo Studio pass for one nature-prop concept sheet (copy of ../../_tools/tripo_sheet.sh for sheets 08–12):
# upload → Smart Mesh (clean topology, quad, <faces> polycount) → tripo_finish.sh (Smart UV + Save → Generate Texture
# → Export GLB). Runs in the tab pinned by CDP_TARGET (target.txt) of the CDP Chrome (port 9333, logged in).
# The model's page is appended to ../meshes.txt once its mesh is done, so tripo_open.sh + tripo_finish.sh can resume.
# Usage: tripo_sheet.sh <name> [faces=5000]   (reads assets_2d/<name>.png, writes tripo-models/nature/<name>.glb)
set -e
n="$1"
faces="${2:-5000}"
T="$(cd "$(dirname "$0")" && pwd)"
SRC="E:\\Diablo2\\art-output\\mmo-hub-bloodmoor\\assets_2d\\$n.png"
OUT=/e/Diablo2/art-output/tripo-models/nature
[ -f "$OUT/inputs/$n.png" ] && SRC="E:\\Diablo2\\art-output\\tripo-models\\nature\\inputs\\$n.png" # rows from compose_rows.py
export CDP_TARGET="${CDP_TARGET:-$(cat "$T/target.txt")}"
mkdir -p "$OUT" "$OUT/_shots"
cd "$T"
log() { echo "[$(date +%H:%M:%S)] $n: $*"; }

node cdp.mjs goto https://studio.tripo3d.ai/workspace/generate > /dev/null
bash step.sh "await sleep(2000); return await clickButton(/^Smart Mesh\$/)" > /dev/null
# Polycount for the whole sheet (Tripo keeps it as the account default; batch.sh puts 5000 back at the end).
bash tripo_faces.sh "$faces" > /dev/null
node cdp.mjs upload "input[type=file][accept^=image]" "$SRC" > /dev/null
log "uploaded ($faces faces)"
# Done = the face count and the Export button are up (the Generate button keeps saying Generating... while the other
# three variants of a 4-variant run finish, so that text is no signal).
bash step.sh "await waitUntil(() => !!findButton(/^Generate\s*100\$/), 300000, 1000); await sleep(2000); await clickButton(/^Generate\s*100\$/, 8000);
  const s = await waitUntil(() => /Faces\s*\d+/.test(bodyText()) && !!findButton(/^Export\$/), 1500000, 3000);
  await sleep(8000); return 'mesh ' + s + 's'"
echo "$n $(node cdp.mjs eval 'location.href' | tr -d '"')" >> "$OUT/meshes.txt"
log "mesh $(node cdp.mjs eval "(document.body.innerText.match(/Faces\s*(\d+)/) || [])[1]" | tr -d '"') faces"
node cdp.mjs shot "$OUT/_shots/${n}_1mesh.png" > /dev/null
bash tripo_finish.sh "$n"
