#!/bin/bash
# Screenshot the first <n> models of the Assets panel (path, face count) to pick the fullest of the 4 variants
# Tripo makes per sheet. Usage: tripo_variants.sh [n=20]   → ../_shots/variants/NN.png + ../_shots/variants/list.txt
cd "$(dirname "$0")"
export CDP_TARGET="${CDP_TARGET:-$(cat target.txt)}"
n="${1:-20}"
OUT=../_shots/variants
: > $OUT/list.txt
node cdp.mjs goto https://studio.tripo3d.ai/workspace/generate > /dev/null
for k in $(seq 0 $((n - 1))); do
	r=$(bash step.sh "await sleep(1500);
	  const thumbs = () => [...document.querySelectorAll('img')].filter((i) => { const b = i.getBoundingClientRect(); return b.x > 1300 && b.width > 60 && b.height > 60; });
	  await waitUntil(() => thumbs().length > $k, 30000, 500);
	  const t = thumbs()[$k]; t.scrollIntoView({ block: 'center' }); await sleep(500); t.click(); await sleep(4500);
	  await waitUntil(() => /Faces\s*\d+/.test(bodyText()), 30000, 1000).catch(() => 0);
	  return location.pathname.split('/').pop() + ' ' + ((bodyText().match(/Faces\s*(\d+)/) || [])[1] || '?')" | tr -d '"')
	printf '%02d %s\n' $k "$r" | tee -a $OUT/list.txt
	node cdp.mjs shot $OUT/$(printf '%02d' $k).png > /dev/null
done
