#!/bin/bash
# Generate one camp prop sheet with Codex CLI. If no PNG comes out, retry once in a fresh codex session.
n="$1"
A=/e/Diablo2/art-output/mmo-hub-bloodmoor/assets_2d
T=$A/_tasks_camp2
cd /e/Diablo2
for attempt in 1 2; do
	codex exec --enable image_generation -s workspace-write -C 'E:\Diablo2' \
		-i "$A/asset_01_cart_turnaround.png" -i "$A/asset_02_tent_sheet.png" -i "$A/_refs/ref_v3_bonfire.png" \
		-o "$T/$n.result$attempt.txt" - < "$T/$n.task.txt" > "$T/$n.log$attempt" 2>&1
	[ -f "$A/$n.png" ] && break
done
echo "$n attempt=$attempt png=$(ls "$A/$n"*.png 2>/dev/null | wc -l)"
