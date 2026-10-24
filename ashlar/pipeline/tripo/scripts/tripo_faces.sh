#!/bin/bash
# Set Smart Mesh → Customize Poly Counts (quad) to <faces> on the generate page of the pinned Tripo tab.
# The field only takes real typing (a scripted value is shown but not stored); Tripo keeps it as the account default.
# Usage: tripo_faces.sh <faces 500..25000>
faces="$1"
cd "$(dirname "$0")"
export CDP_TARGET="${CDP_TARGET:-$(cat target.txt)}"
open="await waitUntil(() => !!findButton(/^Smart Mesh\$/) || !!findButton(/^Quad/), 30000, 500);
  if (!findButton(/^Quad/)) { clickLeaf('Customize Poly Counts'); await waitUntil(() => !!findButton(/^Quad/), 10000, 300); } await sleep(600);"
for try in 1 2 3; do
	xy=$(bash step.sh "$open await clickButton(/^Quad/, 500);
	  const inp = [...document.querySelectorAll('input[type=text]')].find((i) => /^\d+\$/.test(i.value));
	  if (!inp) throw new Error('polycount field not found');
	  const b = inp.getBoundingClientRect(); return Math.round(b.x + b.width / 2) + ' ' + Math.round(b.y + b.height / 2)" | tr -d '"') || continue
	node cdp.mjs click $xy > /dev/null
	sleep 0.5
	node cdp.mjs key a 2 > /dev/null
	node cdp.mjs type "$faces" > /dev/null
	node cdp.mjs key Enter > /dev/null
	sleep 0.8
	got=$(bash step.sh "$open
	  const v = [...document.querySelectorAll('[role=slider]')].map((s) => s.getAttribute('aria-valuenow'))[0];
	  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await sleep(500);
	  return v" | tr -d '"')
	[ "$got" = "$faces" ] && { echo "faces $got"; exit 0; }
	echo "try $try: polycount is $got" >&2
done
echo "polycount stuck at $got" >&2
exit 1
