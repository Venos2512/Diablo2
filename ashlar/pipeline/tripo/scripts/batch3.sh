#!/bin/bash
# The rows Tripo left out of the whole-sheet models, composed into one-row images (compose_rows.py).
cd "$(dirname "$0")"
export CDP_TARGET="$(cat target.txt)"
LOG=../../../../legacy/tripo-models/nature/tripo_batch.log
credits() { bash step.sh "return document.body.innerText.match(/\n(\d{3,6})\n/)?.[1] ?? '?'" | sed "s/^/credits after $1: /" >> "$LOG"; }
reset() {
	node cdp.mjs goto https://studio.tripo3d.ai/workspace/generate > /dev/null
	bash step.sh "await sleep(2000); return await clickButton(/^Smart Mesh\$/)" > /dev/null
	bash tripo_faces.sh 5000 >> "$LOG" 2>&1
}
trap reset EXIT
echo "---- batch3 $(date +%H:%M:%S)" >> "$LOG"
for pair in "asset_10b_buried_corpse_row 12000" "asset_11b_dead_tree_row 15000" "asset_11c_fallen_wood_row 12000"; do
	set -- $pair
	[ -f "../../../../legacy/tripo-models/nature/$1.glb" ] && continue
	bash tripo_sheet.sh "$1" "$2" >> "$LOG" 2>&1 || echo "[$(date +%H:%M:%S)] $1: FAILED" >> "$LOG"
	credits "$1"
done
echo "[$(date +%H:%M:%S)] batch3 done" >> "$LOG"
