#!/bin/bash
T=/e/Diablo2/art-output/terrain-biomes
R=/e/Diablo2/art-direction/reference/terrain-moor
cd /e/Diablo2
for attempt in 1 2 3; do
	codex exec --enable image_generation -s workspace-write -C 'E:\Diablo2' -i "$R/grass_a.png" -i "$R/dirt_dry.png" \
		-o "$T/cliff_rock.result$attempt.txt" - < "$T/cliff_rock.task.txt" > "$T/cliff_rock.log$attempt" 2>&1
	[ -f "$T/cliff_rock/rock.png" ] && [ -f "$T/cliff_rock/mossy.png" ] && break
done
echo "attempt=$attempt png=$(ls "$T/cliff_rock/"*.png 2>/dev/null | wc -l)"
