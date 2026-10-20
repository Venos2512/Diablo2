#!/bin/bash
# Second half of the Tripo pass for one asset, on the model open in the pinned tab (CDP_TARGET): Smart UV unwrap + Save
# → Generate Texture (4K) → PBR → Export GLB → <asset_dir>/<asset_id>.glb. Every step skips itself when it is already done,
# so the script can be rerun after a failure. No screenshots; the caller takes one final look with tripo_views.sh.
# Usage: CDP_TARGET=<tab> tripo_asset_finish.sh <asset_dir> <asset_id> [from=uv|texture|pbr|export]
set -e
dir="$1"; n="$2"; from="${3:-uv}"
T="$(cd "$(dirname "$0")" && pwd)"
cd "$T"
: "${CDP_TARGET:?set CDP_TARGET to the Tripo tab id}"
export CDP_TARGET
log() { echo "[$(date +%H:%M:%S)] $n: $*" | tee -a "$dir/tripo.log"; }
credits() { bash step.sh "return (bodyText().match(/Resources\s*99\+\s*(\d+)/) || [])[1] || '?'" | tr -d '"'; }
idx() { local i=0 s; for s in uv texture pbr export; do [ "$s" = "$1" ] && { echo $i; return; }; i=$((i + 1)); done; echo 99; }
want() { [ "$(idx "$1")" -ge "$(idx "$from")" ]; }

if want uv; then
	c0=$(credits)
	bash step.sh "await waitUntil(() => /Faces\s*\d+/.test(bodyText()), 60000, 1000);
	  clickLeaf('Smart UV'); await waitUntil(() => location.pathname.includes('smart-uv'), 30000, 500); await sleep(2000);
	  await waitUntil(() => !!findButton(/^Unwrap UV/) || !!findButton(/^Save\$/), 30000, 500);
	  if (findButton(/^Unwrap UV/)) await clickButton(/^Unwrap UV/, 3000); // a model unwrapped before only needs its Save
	  const s = await waitUntil(() => !!findButton(/^Save\$/), 900000, 2000);
	  await clickButton(/^Save\$/, 4000); return 'uv ' + s + 's'" > /dev/null
	log "smart uv saved (credits $c0 -> $(credits))"
fi
if want texture; then
	c0=$(credits)
	bash step.sh "clickLeaf('Texture'); await waitUntil(() => location.pathname.includes('/texture/'), 30000, 500); await sleep(2000);
	  await clickButton(/^Generate Texture/, 10000);
	  const s = await waitUntil(() => !/Generating|Texturing|Queue|In progress/i.test(bodyText()) && !!findButton(/^Generate Texture/), 1200000, 2000);
	  await sleep(4000); return 'texture ' + s + 's'" > /dev/null
	log "texture 4K done (credits $c0 -> $(credits))"
fi
if want pbr; then
	c0=$(credits)
	bash step.sh "clickLeaf('PBR'); await waitUntil(() => location.pathname.includes('texture-pbr'), 30000, 500); await sleep(2000);
	  await clickButton(/^Generate PBR/, 3000);
	  // the button keeps its label while it runs: wait for the 'PBR Generation...' text and the Cancel button to go away
	  await waitUntil(() => /PBR Generation/.test(bodyText()) || !!findButton(/^Cancel\$/), 20000, 500).catch(() => 0);
	  const s = await waitUntil(() => !/PBR Generation/.test(bodyText()) && !findButton(/^Cancel\$/), 600000, 2000);
	  await sleep(2000); return 'pbr ' + s + 's'" > /dev/null
	log "pbr done (credits $c0 -> $(credits))"
fi
if want export; then
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
	  const b = [...dlg.querySelectorAll('button')].filter((x) => norm(x.textContent) === 'Export'); b[b.length - 1].click(); await sleep(1500);
	  return 'export ' + fmt + ' ' + norm(dlg.innerText).slice(0, 160)" > /dev/null
	for i in $(seq 1 100); do [ -f ~/Downloads/"$n".glb ] && break; sleep 2; done
	sleep 2
	mv ~/Downloads/"$n".glb "$dir/$n.glb"
	log "exported $dir/$n.glb ($(du -k "$dir/$n.glb" | cut -f1) KB)"
fi
