#!/bin/bash
cd /e/Diablo2/art-output/terrain-biomes
ls *.task.txt | sed 's/.task.txt//' | xargs -P 5 -I{} bash run_one.sh {}
