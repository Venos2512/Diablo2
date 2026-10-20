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
const {concepts,conceptGroups,conceptWorld}=await import('data:text/javascript;base64,'+Buffer.from(conceptBuild.outputFiles[0].text).toString('base64'));
const conceptSources=JSON.parse(await readFile(new URL('../assets/CONCEPT_SOURCES.json',import.meta.url),'utf8'));
assert.equal(concepts.length,conceptSources.records.length);assert.equal(concepts.length,152);assert.equal(conceptGroups.length,16);assert.equal(conceptWorld.id,'d2rr');
assert.deepEqual(concepts.map(c=>c.id),conceptSources.records.map(r=>r.id));
assert.deepEqual(conceptGroups.map(g=>concepts.filter(c=>c.group===g.id).length),[7,6,6,5,5,5,21,20,7,6,17,7,14,8,5,13]);
assert.equal(concepts.reduce((n,c)=>n+c.images.length,0),209);
assert.deepEqual(['progress','todo','approved'].map(s=>concepts.filter(c=>c.status===s).length),[143,8,1]);
assert.equal(new Set([...monsters,...act1Items,...act1Npcs,...multiverseEnemies,...concepts].map(a=>a.id)).size,532);
assert(concepts.every((c,i)=>c.type==='concept'&&c.game==='d2rr'&&c.number===i+1&&c.index===4001+i&&c.image===c.images[0]&&c.media.clips.length===0));
for(const c of concepts){assert(c.name&&c.description&&c.art&&c.role&&c.method&&c.location,c.id);for(const image of c.images){assert(image.src.startsWith('data:image/webp')&&image.thumbSrc.startsWith('data:image/webp')&&image.label&&image.width>0&&image.height>0,c.id);await access(new URL('../'+image.file,import.meta.url));await access(new URL('../'+image.thumb,import.meta.url));await access(new URL('../../'+image.origin,import.meta.url));}}
const conceptState={...state,game:'all',collection:'concept'},noWork={notes:{},favorites:[],statuses:{}},everything=[...monsters,...act1Items,...act1Npcs,...multiverseEnemies,...concepts];
assert.equal(queryAssets(everything,conceptState,noWork).length,152);assert.equal(queryAssets(everything,{...state,game:'d2rr'},noWork).length,152);
assert.equal(queryAssets(everything,{...conceptState,group:'dg-redbound'},noWork).length,7);assert.equal(queryAssets(everything,{...conceptState,status:'todo'},noWork).length,8);
assert.equal(queryAssets(everything,{...conceptState,query:'hong phuoc'},noWork).length,7);assert.equal(queryAssets(everything,{...state,game:'diablo-ii',collection:'concept'},noWork).length,0);
const conceptFiles=new Set(concepts.flatMap(c=>c.images.flatMap(i=>[i.file,i.thumb])));assert(html.split('data:image/webp;base64,').length-1>=conceptFiles.size);
assert(html.includes('<meta name="origin-root" content="../../">')&&html.includes('id="versions"'));
const d2rr=await readFile(new URL('../../D2RR.html',import.meta.url),'utf8');assert(d2rr.includes('<meta name="origin-root" content="">')&&d2rr.length===html.length-'../../'.length);
console.log(`PASS: ${concepts.length} D2RR concept records, ${concepts.reduce((n,c)=>n+c.images.length,0)} embedded concept images, ${conceptGroups.length} concept sets; D2RR.html matches dist.`);
