#!/bin/bash
# Generate one HUD sprite sheet with Codex CLI; if no PNG comes out, retry once in a fresh codex session.
n="$1"
U=/e/Diablo2/art-output/ui-hud-assets
cd /e/Diablo2
for attempt in 1 2; do
	codex exec --enable image_generation -s workspace-write -C 'E:\Diablo2' \
		-i /e/Diablo2/art-output/ui-concepts/01_hud_gameplay.png \
		-o "$U/$n.result$attempt.txt" - < "$U/$n.task.txt" > "$U/$n.log$attempt" 2>&1
	[ -f "$U/$n.png" ] && break
done
echo "$n attempt=$attempt png=$(ls "$U/$n"*.png 2>/dev/null | wc -l)"
