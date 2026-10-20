#!/bin/bash
# Resume after the first batch: texture + export the two tree meshes already made, then the corpse and mossy sheets.
cd "$(dirname "$0")"
export CDP_TARGET="$(cat target.txt)"
LOG=../tripo_batch.log
credits() { bash step.sh "return document.body.innerText.match(/\n(\d{3,6})\n/)?.[1] ?? '?'" | sed "s/^/credits after $1: /" >> "$LOG"; }
reset() {
	node cdp.mjs goto https://studio.tripo3d.ai/workspace/generate > /dev/null
	bash step.sh "await sleep(2000); return await clickButton(/^Smart Mesh\$/)" > /dev/null
	bash tripo_faces.sh 5000 >> "$LOG" 2>&1
}
trap reset EXIT
for pair in "asset_12_burned_tree_sheet c766d8f0" "asset_11_dead_tree_sheet c93dbf3b"; do
	set -- $pair
	[ -f "../$1.glb" ] && continue
	{ bash tripo_open.sh "$2" && bash tripo_finish.sh "$1"; } >> "$LOG" 2>&1 || echo "[$(date +%H:%M:%S)] $1: FAILED" >> "$LOG"
	credits "$1"
done
for pair in "asset_10_buried_corpse_sheet 15000" "asset_09_mossy_rock_sheet 12000"; do
	set -- $pair
	[ -f "../$1.glb" ] && continue
	bash tripo_sheet.sh "$1" "$2" >> "$LOG" 2>&1 || echo "[$(date +%H:%M:%S)] $1: FAILED" >> "$LOG"
	credits "$1"
done
echo "[$(date +%H:%M:%S)] batch2 done" >> "$LOG"
