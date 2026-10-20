#!/bin/bash
# Tripo pass over the nature-prop sheets 08–12 (one whole sheet per model, like the camp sheets), then the account's
# Smart Mesh polycount goes back to Tripo's default 5000. Usage: batch.sh [sheet ...]   (log: ../tripo_batch.log)
cd "$(dirname "$0")"
export CDP_TARGET="$(cat target.txt)"
LOG=../tripo_batch.log
declare -A FACES=(
	[asset_08_rock_sheet]=12000
	[asset_10_buried_corpse_sheet]=15000
	[asset_09_mossy_rock_sheet]=12000
	[asset_11_dead_tree_sheet]=20000
	[asset_12_burned_tree_sheet]=16000
)
sheets=("$@")
[ ${#sheets[@]} -eq 0 ] && sheets=(asset_08_rock_sheet asset_10_buried_corpse_sheet asset_09_mossy_rock_sheet asset_11_dead_tree_sheet asset_12_burned_tree_sheet)
reset() {
	node cdp.mjs goto https://studio.tripo3d.ai/workspace/generate > /dev/null
	bash step.sh "await sleep(2000); return await clickButton(/^Smart Mesh\$/)" > /dev/null
	bash tripo_faces.sh 5000 >> "$LOG" 2>&1
}
trap reset EXIT
for n in "${sheets[@]}"; do
	[ -f "../$n.glb" ] && { echo "$n: already there" >> "$LOG"; continue; }
	bash tripo_sheet.sh "$n" "${FACES[$n]:-5000}" >> "$LOG" 2>&1 || echo "[$(date +%H:%M:%S)] $n: FAILED" >> "$LOG"
	bash step.sh "return document.body.innerText.match(/\n(\d{3,6})\n/)?.[1] ?? '?'" | sed "s/^/credits after $n: /" >> "$LOG"
done
