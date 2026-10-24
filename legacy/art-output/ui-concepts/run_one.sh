#!/bin/bash
# Generate one UI concept with Codex CLI; if no PNG comes out, retry once in a fresh codex session.
n="$1"
U=/e/Diablo2/legacy/art-output/ui-concepts
R=/e/Diablo2/legacy/art-output/mmo-hub-bloodmoor
cd /e/Diablo2
for attempt in 1 2; do
	codex exec --enable image_generation -s workspace-write -C 'E:\Diablo2' \
		-i "$R/v3_ingame/v3_01_bonfire_plaza.png" -i "$R/assets_2d/asset_14_camp_kitchen_set.png" \
		-o "$U/$n.result$attempt.txt" - < "$U/$n.task.txt" > "$U/$n.log$attempt" 2>&1
	[ -f "$U/$n.png" ] && break
done
echo "$n attempt=$attempt png=$(ls "$U/$n"*.png 2>/dev/null | wc -l)"
