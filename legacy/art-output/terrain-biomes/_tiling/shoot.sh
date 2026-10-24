# shoot.sh <prefix> <sets...>: Terrain scene, camera pulled back, albedo + lit view per set
cd /e/Diablo2/legacy/tripo-models/_tools
export CDP_PORT=9481 CDP_MATCH=127.0.0.1:8193
D=/e/Diablo2/legacy/art-output/terrain-biomes/_tiling
p=$1; shift
node cdp.mjs eval "(async()=>{const a=window.__LAB__.app;if(a.current.id!=='terrain'){await a.setScene('terrain',{keepCamera:false});await new Promise(r=>setTimeout(r,5000))}const c=a.rig.camera,t=a.rig.controls.target;c.position.set(t.x+8.5*2.2,33,t.z+17*2.2);c.lookAt(t);a.rig.controls.update();return 1})()" >/dev/null
for b in "$@"; do
  node cdp.mjs eval "(async()=>{const a=window.__LAB__.app;await a.current.setLayerSet('$b');a.setView('albedo');await new Promise(r=>setTimeout(r,2500));return 1})()" >/dev/null
  node cdp.mjs shot $D/${p}_alb_$b.png >/dev/null
  node cdp.mjs eval "(async()=>{window.__LAB__.app.setView('lit');await new Promise(r=>setTimeout(r,1500));return 1})()" >/dev/null
  node cdp.mjs shot $D/${p}_lit_$b.png >/dev/null
done
echo done
