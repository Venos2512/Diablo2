#!/bin/bash
# Full Tripo Studio pass for one concept sheet in the CDP Chrome (port 9333, logged in):
# upload → Smart Mesh (clean topology) → Smart UV unwrap + Save → Generate Texture → Export GLB.
# Usage: tripo_sheet.sh <name>   (reads assets_2d/<name>.png, writes tripo-models/camp/<name>.glb)
set -e
n="$1"
T="$(cd "$(dirname "$0")" && pwd)"
SRC="E:\\Diablo2\\art-output\\mmo-hub-bloodmoor\\assets_2d\\$n.png"
OUT=/e/Diablo2/art-output/tripo-models/camp
mkdir -p "$OUT" "$T/../_shots"
cd "$T"
log() { echo "[$(date +%H:%M:%S)] $n: $*"; }

node cdp.mjs goto https://studio.tripo3d.ai/workspace/generate > /dev/null
bash step.sh "await sleep(2000); return await clickButton(/^Smart Mesh\$/)" > /dev/null
node cdp.mjs upload "input[type=file][accept^=image]" "$SRC" > /dev/null
log "uploaded"
bash step.sh "await sleep(6000); await clickButton(/^Generate\s*100\$/, 8000);
  const s = await waitUntil(() => /Faces/.test(bodyText()) && !/Generating/i.test(bodyText()), 900000, 3000);
  await sleep(8000); return 'mesh ' + s + 's'"
node cdp.mjs shot "../_shots/${n}_1mesh.png" > /dev/null
bash step.sh "clickLeaf('Smart UV'); await waitUntil(() => location.pathname.includes('smart-uv'), 30000, 500); await sleep(3000);
  await clickButton(/^Unwrap UV/, 5000); const s = await waitUntil(() => !!findButton(/^Save\$/), 900000, 3000);
  await clickButton(/^Save\$/, 5000); return 'uv ' + s + 's ' + location.pathname"
bash step.sh "clickLeaf('Texture'); await waitUntil(() => location.pathname.includes('/texture/'), 30000, 500); await sleep(3000);
  await clickButton(/^Generate Texture/, 10000);
  const s = await waitUntil(() => !/Generating|Texturing|Queue|In progress/i.test(bodyText()), 1200000, 3000);
  await sleep(8000); return 'texture ' + s + 's'"
node cdp.mjs shot "../_shots/${n}_2tex.png" > /dev/null
rm -f ~/Downloads/"$n".glb
bash step.sh "
  const exp = [...document.querySelectorAll('button')].filter((b) => norm(b.textContent) === 'Export'); exp[exp.length - 1].click(); await sleep(1500);
  const dlg = [...document.querySelectorAll('[role=dialog]')].find((d) => /Format/.test(d.innerText));
  const fire = (el) => { for (const t of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) el.dispatchEvent(new MouseEvent(t, { bubbles: true, cancelable: true, view: window })); };
  fire(dlg.querySelector('[role=combobox]')); await sleep(800);
  fire([...document.querySelectorAll('[role=option]')].find((o) => norm(o.textContent) === 'GLB')); await sleep(800);
  const inp = dlg.querySelector('input[type=text],input:not([type])');
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(inp, '$n'); inp.dispatchEvent(new Event('input', { bubbles: true }));
  await sleep(500);
  const fmt = norm(dlg.querySelector('[role=combobox]').textContent);
  if (fmt !== 'GLB') throw new Error('format is ' + fmt);
  const b = [...dlg.querySelectorAll('button')].filter((x) => norm(x.textContent) === 'Export'); b[b.length - 1].click(); await sleep(2000);
  return 'export ' + fmt"
for i in $(seq 1 100); do [ -f ~/Downloads/"$n".glb ] && break; sleep 3; done
sleep 3
mv ~/Downloads/"$n".glb "$OUT/$n.glb"
log "saved $OUT/$n.glb ($(du -k "$OUT/$n.glb" | cut -f1) KB)"
