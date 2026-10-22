import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {readFile,access} from 'node:fs/promises';
import {filterMonsters,normalize} from '../src/lib/state.js';
const compiled=await build({entryPoints:[new URL('../src/data/catalog.js',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')],bundle:true,platform:'node',format:'esm',write:false});
const {monsters,groups}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
assert.equal(monsters.length,34);assert.equal(new Set(monsters.map(m=>m.id)).size,34);assert.equal(groups.length,8);
assert.deepEqual(groups.map(g=>monsters.filter(m=>m.group===g.id).length),[5,6,7,2,3,5,3,3]);
assert.equal(monsters.filter(m=>m.kind==='regular').length,21);assert.equal(monsters.filter(m=>m.kind==='unique').length,12);assert.equal(monsters.filter(m=>m.kind==='boss').length,1);
for(const m of monsters){assert(m.image?.src.startsWith('data:image/'),m.name);assert(m.description&&m.art&&m.motions.length,m.name);await access(new URL('../'+m.image.file,import.meta.url));}
assert.equal(filterMonsters(monsters,{query:'ANDARIEL'}).length,1);assert.equal(filterMonsters(monsters,{kind:'special'}).length,13);assert.equal(filterMonsters(monsters,{query:'NO_MATCH_123'}).length,0);assert.equal(normalize('Đánh gần'),'danh gan');
const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');assert(!html.includes('/*__JS__*/'));assert(!/<script[^>]+src=/i.test(html));assert(html.includes('Multiverse Book of Cain'));assert(html.includes('lang="en"'));
const {queryAssets}=await import('../src/lib/databook.js');
const multiverseBuild=await build({entryPoints:[new URL('../src/data/multiverse.js',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')],bundle:true,platform:'node',format:'esm',write:false});
const {games,multiverseEnemies}=await import('data:text/javascript;base64,'+Buffer.from(multiverseBuild.outputFiles[0].text).toString('base64'));
assert.equal(games.length,5);assert.equal(multiverseEnemies.length,181);
assert.deepEqual(games.slice(1).map(g=>multiverseEnemies.filter(a=>a.game===g.id).length),[90,33,34,24]);
assert.equal(multiverseEnemies.filter(a=>a.image?.src).length,179);
assert.deepEqual(['exact','manual','family'].map(kind=>multiverseEnemies.filter(a=>a.image?.referenceKind===kind).length),[144,4,31]);
assert.equal(multiverseEnemies.filter(a=>a.game==='torchlight'&&a.location==='Torchlight I · area not verified').length,27);
for(const enemy of multiverseEnemies){assert(enemy.source&&enemy.media.clips.length===0,enemy.id);if(enemy.image?.src){assert(enemy.image.source&&enemy.image.file,enemy.id);await access(new URL('../'+enemy.image.file,import.meta.url));}}
const itemBuild=await build({entryPoints:[new URL('../src/data/items.js',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')],bundle:true,platform:'node',format:'esm',write:false});
const {act1Items,itemGroups}=await import('data:text/javascript;base64,'+Buffer.from(itemBuild.outputFiles[0].text).toString('base64'));
assert.equal(act1Items.length,157);
assert.deepEqual(itemGroups.map(g=>act1Items.filter(a=>a.group===g.id).length),[3,18,61,38,28,7,2]);
assert.equal(act1Items.filter(a=>a.image?.src).length,153);
assert.equal(new Set([...monsters,...act1Items].map(a=>a.id)).size,191);
assert(act1Items.filter(a=>a.qualityLevel!=null).every(a=>a.qualityLevel<=18));
for(const item of act1Items){assert(item.description&&item.art&&item.source,item.name);if(item.image?.src)await access(new URL('../'+item.image.file,import.meta.url));}
assert.equal(queryAssets([...monsters,...act1Items],{collection:'item',group:'consumable',kind:'all',status:'all',query:'',sort:'catalog',saved:false},{favorites:[],statuses:{}}).length,18);
assert(html.includes('Book of Cain'));
const npcBuild=await build({entryPoints:[new URL('../src/data/npcs.js',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')],bundle:true,platform:'node',format:'esm',write:false});
const {act1Npcs,npcGroups}=await import('data:text/javascript;base64,'+Buffer.from(npcBuild.outputFiles[0].text).toString('base64'));
assert.equal(act1Npcs.length,8);
assert.deepEqual(npcGroups.map(g=>act1Npcs.filter(a=>a.group===g.id).length),[3,2,3]);
assert.equal(act1Npcs.filter(a=>a.scope==='Named Act I NPC').length,7);
assert.equal(new Set([...monsters,...act1Items,...act1Npcs].map(a=>a.id)).size,199);
assert.equal(new Set([...monsters,...act1Items,...act1Npcs,...multiverseEnemies].map(a=>a.id)).size,380);
assert.equal(queryAssets([...monsters,...act1Items,...act1Npcs,...multiverseEnemies],{collection:'creature',game:'torchlight',group:'all',kind:'all',status:'all',query:'',sort:'catalog',saved:false},{favorites:[],statuses:{}}).length,34);
for(const npc of act1Npcs){assert(npc.image?.src.startsWith('data:image/gif'),npc.name);assert(npc.description&&npc.art&&npc.quests.length&&npc.source,npc.name);await access(new URL('../'+npc.image.file,import.meta.url));}
assert.equal(queryAssets([...monsters,...act1Items,...act1Npcs],{collection:'npc',group:'rogue-defenders',kind:'all',status:'all',query:'',sort:'catalog',saved:false},{favorites:[],statuses:{}}).length,3);
const state={collection:'all',group:'all',kind:'all',status:'all',query:'',sort:'catalog',saved:false}, workspace={notes:{},favorites:['andariel'],statuses:{andariel:'progress'}};
assert.equal(queryAssets(monsters,state,workspace).length,34);
assert.equal(queryAssets(monsters,{...state,collection:'environment'},workspace).length,0);
assert.equal(queryAssets(monsters,{...state,saved:true},workspace)[0].id,'andariel');
assert.equal(queryAssets(monsters,{...state,status:'progress'},workspace).length,1);
assert.equal(queryAssets(monsters,{...state,group:'brutes'},workspace).length,5);
assert.equal(queryAssets(monsters,{...state,query:'jail'},workspace)[0].id,'pitspawn-fouldog');
assert(monsters.every(m=>m.type==='creature'&&m.media.clips.length===0&&m.media.model===null));
assert(!/[ăâđêôơưĂÂĐÊÔƠƯ]/u.test(JSON.stringify(monsters.map(({image,...m})=>m))));
console.log('PASS: 380 records across five games, 374 embedded images, game filters, source files and standalone bundle.');

assert.equal(new Set(multiverseEnemies.map(a=>a.index)).size,multiverseEnemies.length);
assert.match(multiverseEnemies.find(a=>a.id==='titan-quest-talos').condition,/Epic/);
assert.match(multiverseEnemies.find(a=>a.id==='titan-quest-lernean-hydra').condition,/Legendary/);
assert.match(multiverseEnemies.find(a=>a.id==='dungeon-siege-phrak-ballista').condition,/Utraean/);
assert.equal(multiverseEnemies.find(a=>a.id==='dungeon-siege-krug-scout').role,'Melee');
assert(multiverseEnemies.every(a=>a.motions.length>0&&a.media.clips.length===0));
assert(html.includes('content-source')&&html.includes('encounter-condition'));

// D2RR concept art: records, source files, filters and the inlined WebP images.
const stubMedia={name:'stub-media',setup(b){b.onResolve({filter:/^concept-media$/},()=>({path:'concept-media',namespace:'stub'}));b.onLoad({filter:/.*/,namespace:'stub'},async()=>{const data=JSON.parse(await readFile(new URL('../src/data/concepts.json',import.meta.url),'utf8'));return {contents:JSON.stringify(Object.fromEntries(data.records.flatMap(r=>r.images.flatMap(i=>[[i.file,'data:image/webp;base64,'+i.file],[i.thumb,'data:image/webp;base64,'+i.thumb]])))),loader:'json'};});}};
const conceptBuild=await build({entryPoints:[new URL('../src/data/concepts.js',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')],bundle:true,platform:'node',format:'esm',write:false,plugins:[stubMedia]});
const {concepts,conceptGroups,conceptWorld,conceptWorlds}=await import('data:text/javascript;base64,'+Buffer.from(conceptBuild.outputFiles[0].text).toString('base64'));
const conceptSources=JSON.parse(await readFile(new URL('../assets/CONCEPT_SOURCES.json',import.meta.url),'utf8'));
assert.equal(concepts.length,conceptSources.records.length);assert.equal(concepts.length,105);assert.equal(conceptGroups.length,9);assert.equal(conceptWorld.id,'d2rr');assert.deepEqual(conceptWorlds.map(w=>w.id),['ashlar','d2rr']);assert.deepEqual(conceptGroups.map(g=>g.world),['ashlar',...Array(8).fill('d2rr')]);
assert.deepEqual(concepts.map(c=>c.id),conceptSources.records.map(r=>r.id));
assert.deepEqual(conceptGroups.map(g=>concepts.filter(c=>c.group===g.id).length),[28,7,6,17,7,14,8,5,13]);
assert.equal(concepts.reduce((n,c)=>n+c.images.length,0),153);
assert.deepEqual(['progress','todo','approved'].map(s=>concepts.filter(c=>c.status===s).length),[72,4,29]);
assert.equal(new Set([...monsters,...act1Items,...act1Npcs,...multiverseEnemies,...concepts].map(a=>a.id)).size,485);
assert(concepts.every((c,i)=>c.type==='concept'&&c.game===(c.group==='ashlar-chot'?'ashlar':'d2rr')&&c.number===i+1&&c.index===4001+i&&c.image===c.images[0]&&c.media.clips.length===0));
for(const c of concepts){assert(c.name&&c.description&&c.art&&c.role&&c.method&&c.location,c.id);for(const image of c.images){assert(image.src.startsWith('data:image/webp')&&image.thumbSrc.startsWith('data:image/webp')&&image.label&&image.width>0&&image.height>0,c.id);await access(new URL('../'+image.file,import.meta.url));await access(new URL('../'+image.thumb,import.meta.url));await access(new URL('../../'+image.origin,import.meta.url));}}
const conceptState={...state,game:'all',collection:'concept'},noWork={notes:{},favorites:[],statuses:{}},everything=[...monsters,...act1Items,...act1Npcs,...multiverseEnemies,...concepts];
assert.equal(queryAssets(everything,conceptState,noWork).length,105);assert.equal(queryAssets(everything,{...state,game:'d2rr'},noWork).length,77);assert.equal(queryAssets(everything,{...state,game:'ashlar'},noWork).length,28);
assert.equal(queryAssets(everything,{...conceptState,group:'ashlar-chot'},noWork).length,28);assert.equal(queryAssets(everything,{...conceptState,status:'todo'},noWork).length,4);
assert.equal(queryAssets(everything,{...conceptState,query:'concept chot'},noWork).length,28);assert.equal(queryAssets(everything,{...conceptState,query:'dying gods'},noWork).length,0);assert.equal(queryAssets(everything,{...state,game:'diablo-ii',collection:'concept'},noWork).length,0);
const conceptFiles=new Set(concepts.flatMap(c=>c.images.flatMap(i=>[i.file,i.thumb])));assert(html.split('data:image/webp;base64,').length-1>=conceptFiles.size);
assert(html.includes('<meta name="origin-root" content="../../">')&&html.includes('id="versions"'));
const d2rr=await readFile(new URL('../../D2RR.html',import.meta.url),'utf8');assert(d2rr.includes('<meta name="origin-root" content="">')&&d2rr.length===html.length-'../../'.length);
console.log(`PASS: ${concepts.length} concept records (ASHLAR + D2RR), ${concepts.reduce((n,c)=>n+c.images.length,0)} embedded concept images, ${conceptGroups.length} concept sets; D2RR.html matches dist.`);

// ASHLAR "Concept chốt": exactly the 28 approved monster sheets, approved by default; older project monster groups are gone.
const ashlarPaths=['B01_sextons_dog/vA/concept_r2','B02_lullaby_man/vA/concept_r2','B03_ember_pot/vA/concept','B04_willow_bride/vA/concept','B05_hospice_mother/vA/concept_r2','D01_hodling/vB/concept_r2','D02_kiln_shaman/vA/concept_r2','D04_tithe_thief/vA/concept_r2','F01_body_snatcher/vA/concept_r2b','F02_poppy_nurse/vA/concept_r2','P01_the_soothed/vA/concept_r2','P02_hush_herald/vA/concept_r2','P03_hush_moths/vA/concept_r2b','P04_hive_sleeper/vA/concept_r2','P05_wet_nurse/vB/concept_r2','P06_poppy_mound/vA/concept_r2','P07_cradle_warden/vA/concept_r2','U01_shambler/vA/concept_r2','U02_charnel_dead/vA/concept_r2b','U03_charnel_bowman/vA/concept_r2','U04_charnel_ghoul/vA/concept_r2','U05_the_swollen/vA/concept_r2','W01_mortar_rat/vB/concept_r2','W02_gibbet_crow/vB/concept_r2b','W03_hush_wolf/vA/concept_r2','W04_mire_sucker/vB/concept_r2','W06_willow_hulk/vB/concept','W07_shroud_spinner/vA/concept_r2'].map(p=>'ashlar/art/map-01-concepts/monsters/'+p+'.png');
const ashlar=concepts.filter(c=>c.group==='ashlar-chot');
assert.deepEqual(ashlar.map(c=>c.images.map(i=>i.origin).join()),ashlarPaths);assert.equal(new Set(ashlarPaths).size,28);
assert(ashlar.every(c=>c.images.length===1&&c.status==='approved'&&c.game==='ashlar'&&c.tags.includes('ashlar')));
assert.equal(ashlar.length,28);assert.equal(conceptGroups[0].id,'ashlar-chot');assert(conceptGroups[0].name.startsWith('Concept chốt'));
assert(!concepts.some(c=>/^concept-(dg|act1)-/.test(c.id))&&!conceptGroups.some(g=>/^(dg|act1)-/.test(g.id)));
assert(concepts.every(c=>c.group==='ashlar-chot'||!c.images.some(i=>/^art-output\/(dying-gods-act1|act1-monsters)/.test(i.origin))));
for(const dir of ['dying-gods','act1-monsters','act1-monsters-v2'])await assert.rejects(access(new URL('../assets/concepts/'+dir,import.meta.url)),dir);
const wantedFiles=new Set(concepts.flatMap(c=>c.images.flatMap(i=>[i.file,i.thumb])).map(f=>f.replace(/^assets\/concepts\//,'')));
const {readdir}=await import('node:fs/promises');
for(const dir of await readdir(new URL('../assets/concepts',import.meta.url),{withFileTypes:true}))if(dir.isDirectory())for(const f of await readdir(new URL('../assets/concepts/'+dir.name,import.meta.url)))assert(wantedFiles.has(dir.name+'/'+f),'stale concept file '+dir.name+'/'+f);
assert(html.includes('Concept chốt')&&d2rr.includes('Concept chốt'));
console.log(`PASS: ASHLAR Concept chốt = ${ashlar.length} approved monster sheets; old Dying Gods and Act I monster concepts removed; no stale WebP files.`);
