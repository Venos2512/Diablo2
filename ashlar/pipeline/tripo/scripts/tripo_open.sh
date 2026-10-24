#!/bin/bash
# Open an earlier model of the pinned Tripo tab from the Assets panel: the thumbnails are clicked in order until the
# model page's path holds <id> (a piece of the model's uuid, see ../../../../legacy/tripo-models/nature/meshes.txt). Usage: tripo_open.sh <id>
set -e
id="$1"
cd "$(dirname "$0")"
export CDP_TARGET="${CDP_TARGET:-$(cat target.txt)}"
node cdp.mjs goto https://studio.tripo3d.ai/workspace/generate > /dev/null
bash step.sh "await sleep(3000);
  const thumbs = () => [...document.querySelectorAll('img')].filter((i) => { const b = i.getBoundingClientRect(); return b.x > 1300 && b.width > 60 && b.height > 60; });
  await waitUntil(() => thumbs().length > 0, 30000, 500);
  for (let k = 0; k < 16; k++) {
    const t = thumbs()[k];
    if (!t) break;
    t.click();
    await sleep(4000);
    if (location.pathname.includes('$id')) { await waitUntil(() => /Faces\s*\d+/.test(bodyText()), 60000, 1000); return 'opened ' + location.pathname; }
  }
  throw new Error('model $id not found in the first thumbnails')"
