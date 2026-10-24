#!/bin/bash
# Second half of the Tripo pass, on the model open in the pinned tab: Smart UV unwrap + Save → Generate Texture (4K,
# 20 credits) → Export GLB to legacy/tripo-models/nature/<name>.glb. Usage: tripo_finish.sh <name>
set -e
n="$1"
T="$(cd "$(dirname "$0")" && pwd)"
OUT=/e/Diablo2/legacy/tripo-models/nature
export CDP_TARGET="${CDP_TARGET:-$(cat "$T/target.txt")}"
cd "$T"
log() { echo "[$(date +%H:%M:%S)] $n: $*"; }

bash step.sh "await waitUntil(() => /Faces\s*\d+/.test(bodyText()), 60000, 1000);
  clickLeaf('Smart UV'); await waitUntil(() => location.pathname.includes('smart-uv'), 30000, 500); await sleep(3000);
  await waitUntil(() => !!findButton(/^Unwrap UV/) || !!findButton(/^Save\$/), 30000, 500);
  if (findButton(/^Unwrap UV/)) await clickButton(/^Unwrap UV/, 5000); // a model unwrapped before only needs its Save
  const s = await waitUntil(() => !!findButton(/^Save\$/), 900000, 3000);
  await clickButton(/^Save\$/, 5000); return 'uv ' + s + 's ' + location.pathname"
log "uv saved"
bash step.sh "clickLeaf('Texture'); await waitUntil(() => location.pathname.includes('/texture/'), 30000, 500); await sleep(3000);
  await clickButton(/^Generate Texture/, 15000);
  const s = await waitUntil(() => !/Generating|Texturing|Queue|In progress/i.test(bodyText()) && !!findButton(/^Generate Texture/), 1200000, 3000);
  await sleep(8000); return 'texture ' + s + 's'"
log "textured"
node cdp.mjs shot "$OUT/_shots/${n}_2tex.png" > /dev/null
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
