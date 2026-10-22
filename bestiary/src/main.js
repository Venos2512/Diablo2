import {assets,collections,collectionById,assetById} from './data/registry.js';
import {groups,groupById} from './data/catalog.js';
import {itemGroups,itemGroupById} from './data/items.js';
import {npcGroups,npcGroupById} from './data/npcs.js';
import {games,multiverseGroups,multiverseGroupById} from './data/multiverse.js';
import {conceptWorlds,conceptGroups,conceptGroupById} from './data/concepts.js';
import {readWorkspace,persist,queryAssets,downloadJSON} from './lib/databook.js';
import {createModelViewer} from './viewer/model.js';

const $=id=>document.getElementById(id),workspace=readWorkspace();
const state={collection:'concept',game:conceptWorlds[0].id,group:'all',kind:'all',status:'all',sort:'catalog',query:'',saved:false,view:'grid'};
const worlds=[...conceptWorlds,...games],isConceptWorld=id=>conceptWorlds.some(w=>w.id===id),gameById=Object.fromEntries(worlds.map(game=>[game.id,game]));
const allGroupById={...groupById,...multiverseGroupById,...itemGroupById,...npcGroupById,...conceptGroupById};
// Repository root relative to this HTML file (set per output by the build; "none" on the website, which has no
// original PNGs). Concept origins are repo-relative.
const originRoot=document.querySelector('meta[name="origin-root"]')?.content||'',originsLinked=originRoot!=='none';
const statusLabels={reference:'Reference',todo:'To do',progress:'In progress',approved:'Approved'};
let visible=[],selected=null,viewer=null,toastTimer,loadSequence=0,imageIndex=0;
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const isConcept=a=>a?.type==='concept';
const conceptImageTotal=assets.filter(isConcept).reduce((n,a)=>n+a.images.length,0);
const inGame=a=>state.game==='all'||(a.game||'diablo-ii')===state.game;
const countType=id=>assets.filter(a=>inGame(a)&&(id==='all'||a.type===id)).length;
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3500);}
function store(){const ok=persist(workspace);if(!ok)toast('Storage is unavailable. Export your workspace to keep a backup.');return ok;}
function status(a){return workspace.statuses[a.id]||a.status||'reference';}
function saved(id){return workspace.favorites.includes(id);}
function toggleSaved(id){workspace.favorites=saved(id)?workspace.favorites.filter(x=>x!==id):[...workspace.favorites,id];store();render();if(selected?.id===id)updateSaved();}
function updateSaved(){const on=saved(selected.id);$('record-save').textContent=on?'★':'☆';$('record-save').setAttribute('aria-pressed',String(on));$('record-save').setAttribute('aria-label',on?'Remove saved asset':'Save asset');}

const gameOptions=[{id:'all',name:'All worlds',scope:'ASHLAR concept chốt + D2RR concepts + five-game archive'},...worlds];
gameOptions.forEach(game=>{const b=el('button','game-tab');b.type='button';b.dataset.game=game.id;b.setAttribute('aria-pressed','false');b.append(el('span','game-tab-title',game.name));if(game.scope)b.append(el('small','',game.scope));b.addEventListener('click',()=>{state.game=game.id;state.collection='all';state.saved=false;resetFilters();render();});$('game-tabs').append(b);});
collections.forEach(c=>{const b=el('button','nav-button');b.dataset.collection=c.id;b.append(el('span','nav-icon',c.symbol),el('span','',c.name),el('span','count',String(countType(c.id))));b.addEventListener('click',()=>{state.collection=c.id;state.saved=false;resetFilters();render();});$('collections').append(b);});
function groupName(a){return allGroupById[a.group]?.name||a.role||collectionById[a.type]?.name;}
function syncGroupFilter(){const concept=state.collection==='concept'||isConceptWorld(state.game);const groupSet=concept?conceptGroups.filter(g=>!isConceptWorld(state.game)||g.world===state.game):state.collection==='item'?itemGroups:state.collection==='npc'?npcGroups:state.game==='diablo-ii'?groups:state.game==='all'?[...groups,...multiverseGroups]:multiverseGroups.filter(g=>g.id.startsWith(state.game+'-'));$('group').replaceChildren(new Option(concept?'All concept sets':state.collection==='item'?'All item groups':state.collection==='npc'?'All NPC groups':'All families','all'),...groupSet.map(g=>new Option(g.name,g.id)));$('group').value=state.group;}
$('total').textContent=assets.length;$('reference-total').textContent=assets.filter(a=>a.image?.src).length;$('model-total').textContent=assets.filter(a=>a.media?.model).length;$('clip-total').textContent=assets.reduce((n,a)=>n+(a.media?.clips?.length||0),0);
function resetFilters(){Object.assign(state,{group:'all',kind:'all',status:'all',query:''});['group','kind','status'].forEach(id=>$(id).value='all');$('search').value='';syncGroupFilter();}
function makeStatus(a){return el('span','status '+status(a),statusLabels[status(a)]||'Reference');}
function thumbnail(a){if(!a.image?.src)return el('span','asset-placeholder','◇');const i=new Image();i.src=a.image.thumbSrc||a.image.src;i.alt=a.name;i.loading='lazy';i.decoding='async';if(isConcept(a))i.className='concept-thumb';return i;}
function makeCard(a){
 const card=el('article','asset-card '+(isConcept(a)?'concept':a.kind||''));const b=el('button','asset-open');b.setAttribute('aria-label','Open '+a.name);
 const picture=el('div','thumb');picture.append(thumbnail(a),el('span','thumb-label',isConcept(a)?a.role.toUpperCase():a.image?.referenceKind==='family'?'FAMILY IMAGE':a.image?.referenceKind==='manual'?'MANUAL ART':a.kind==='boss'?'BOSS':a.kind==='unique'?'UNIQUE':collectionById[a.type]?.name.toUpperCase()||'ASSET'));
 if(a.images?.length>1)picture.append(el('span','thumb-count',a.images.length+' images'));
 const copy=el('div','card-copy');copy.append(el('h2','',a.name),el('p','',groupName(a)));const meta=el('div','card-meta');meta.append(el('span','',gameById[a.game||'diablo-ii']?.name+' · '+(a.act||'Unassigned')),makeStatus(a));copy.append(meta);b.append(picture,copy);b.addEventListener('click',()=>openRecord(a.id));
 const favorite=el('button','favorite',saved(a.id)?'★':'☆');favorite.setAttribute('aria-label',(saved(a.id)?'Unsave ':'Save ')+a.name);favorite.setAttribute('aria-pressed',String(saved(a.id)));favorite.addEventListener('click',()=>toggleSaved(a.id));card.append(b,favorite);return card;
}
function makeRow(a){const tr=el('tr');const first=el('td'),button=el('button','table-asset');button.setAttribute('aria-label','Open '+a.name);const text=el('span','',a.name);text.append(el('small','',a.id));button.append(thumbnail(a),text);button.addEventListener('click',()=>openRecord(a.id));first.append(button);const type=el('td','',collectionById[a.type]?.name||a.type);type.append(el('small','',groupName(a)));const s=el('td');s.append(makeStatus(a));const f=el('td'),fav=el('button','table-save',saved(a.id)?'★':'☆');fav.setAttribute('aria-label',(saved(a.id)?'Unsave ':'Save ')+a.name);fav.setAttribute('aria-pressed',String(saved(a.id)));fav.addEventListener('click',()=>toggleSaved(a.id));f.append(fav);tr.append(first,type,el('td','',a.role||'—'),el('td','',isConcept(a)?a.images.length+(a.images.length===1?' concept image':' concept images'):a.media?.model?'3D model':a.image?.src?'Image reference':'Not linked'),s,f);return tr;}
function render(){
 visible=queryAssets(assets,state,workspace);const collection=collectionById[state.collection];
 document.querySelectorAll('[data-game]').forEach(b=>{const active=b.dataset.game===state.game;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
 document.querySelectorAll('[data-collection]').forEach(b=>{const active=b.dataset.collection===state.collection&&!state.saved;b.classList.toggle('active',active);b.setAttribute('aria-current',active?'page':'false');});
 document.querySelectorAll('[data-collection] .count').forEach(n=>{n.textContent=String(countType(n.parentElement.dataset.collection));});
 const gameAssets=assets.filter(inGame);$('total').textContent=gameAssets.length;$('reference-total').textContent=gameAssets.filter(a=>a.image?.src).length;$('model-total').textContent=gameAssets.filter(a=>a.media?.model).length;$('clip-total').textContent=gameAssets.reduce((n,a)=>n+(a.media?.clips?.length||0),0);
 $('saved').classList.toggle('active',state.saved);$('saved-count').textContent=workspace.favorites.filter(id=>assetById[id]).length;
 const selectedGame=gameById[state.game];const title=state.saved?'Saved assets':state.collection==='all'&&selectedGame?selectedGame.name:collection.name;$('title').replaceChildren(document.createTextNode(title),el('span','','.'));$('crumb').textContent=title;$('subtitle').textContent=state.saved?'Your shortlist of references and production assets.':state.collection==='all'&&selectedGame?[selectedGame.scope,isConceptWorld(selectedGame.id)?`${countType('concept')} concept records · ${conceptImageTotal} images`:countType('creature')+' enemy references'].filter(Boolean).join(' · '):collection.description;
 const supportsCreatures=['all','creature'].includes(state.collection)&&!isConceptWorld(state.game);$('group').hidden=!['all','creature','item','npc','concept'].includes(state.collection);$('kind').hidden=!supportsCreatures;
 $('results').textContent=`${visible.length} ${visible.length===1?'asset':'assets'}${visible.length!==countType(state.collection)?' shown':''}`;
 $('cards').hidden=state.view!=='grid'||!visible.length;$('table-wrap').hidden=state.view!=='table'||!visible.length;
 $('grid-view').setAttribute('aria-pressed',String(state.view==='grid'));$('table-view').setAttribute('aria-pressed',String(state.view==='table'));
 $('cards').replaceChildren(...(state.view==='grid'?visible.map(makeCard):[]));$('rows').replaceChildren(...(state.view==='table'?visible.map(makeRow):[]));
 $('empty').hidden=visible.length>0;
 const unused=countType(state.collection)===0&&!state.saved;
 $('empty-icon').textContent=unused?collection.symbol:'⌕';$('empty-title').textContent=unused?`${collection.name}, ready for your first assets`:state.saved&&!workspace.favorites.length?'Build your reference shortlist':'No assets match these filters';
 $('empty-copy').textContent=unused?collection.description+' Add records when your references are ready.':state.saved&&!workspace.favorites.length?'Use the star on any asset to keep it here.':'Try another search, reset the filters, or browse all assets.';
 $('empty-action').textContent=unused?'Read the asset guide':'Browse all assets';$('empty-action').onclick=()=>{if(unused)$('guide-dialog').showModal();else{state.collection='all';state.saved=false;resetFilters();render();}};
 updateNav();
}
function updateNav(){const i=visible.findIndex(a=>a.id===selected?.id);$('previous').disabled=i<=0;$('next').disabled=i<0||i>=visible.length-1;}
function resetModel(){loadSequence++;viewer?.dispose();viewer=null;$('model-empty').hidden=false;$('model-message').textContent='';$('clip-controls').hidden=true;$('clip').replaceChildren();$('fit-model').disabled=true;$('model-file').value='';$('speed').value='1';$('play').textContent='Pause';}
function switchMedia(name){document.querySelectorAll('[data-media]').forEach(b=>{const active=b.dataset.media===name;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});$('reference-pane').hidden=name!=='reference';$('model-pane').hidden=name!=='model';}
function openRecord(id){
 selected=assetById[id];if(!selected)return;const a=selected,concept=isConcept(a);resetModel();switchMedia('reference');$('record-dialog').classList.toggle('concept',concept);
 $('record-code').textContent=`${collectionById[a.type]?.name||'ASSET'} / ${String(concept?a.number:a.index||assets.indexOf(a)+1).padStart(3,'0')}`;
 $('record-family').textContent=groupName(a);$('record-name').textContent=a.name;$('description').textContent=a.description||'Description not added yet.';
 $('record-tags').replaceChildren(...[gameById[a.game||'diablo-ii']?.name,a.act,a.role,...(a.quests||[]),a.kind==='boss'?'Boss':a.kind==='unique'?'Unique enemy':null].filter(Boolean).map(t=>el('span','',t)));
 $('record-type').textContent=collectionById[a.type]?.name||a.type;$('location').textContent=a.location||'Not documented';
 $('base-label').textContent=concept?'Family / reference':'Base reference';$('base').textContent=a.base||(concept?'Not documented':'No base reference linked');
 document.querySelectorAll('[data-for]').forEach(row=>row.hidden=row.dataset.for!==(concept?'concept':'reference'));
 if(concept)[['palette',a.palette],['scale',a.scale],['method',a.method],['layout',a.layout]].forEach(([key,value])=>{$(key).textContent=value||'';$(key).parentElement.hidden=!value;});
 $('encounter-condition').textContent=a.condition||a.scope||'No additional condition documented';
 $('content-source').hidden=!(a.source||a.image?.source);if(a.source||a.image?.source)$('content-source').href=a.source||a.image.source;
 $('reference-tab').textContent=concept?'Concept':'Reference';$('art-title').textContent=concept?'Review notes':'Art direction notes';$('motion-details').hidden=!a.motions?.length;
 $('media-note-title').textContent=concept?(gameById[a.game]?.name||'D2RR')+' concept art':'Reference collection';
 $('media-note-copy').textContent=concept?'Original project concept, embedded as a WebP copy of the source PNG. Statuses start from the review notes; change them as the design moves on.':'Original images support visual research. Production models and verified animation clips can be linked as the library grows.';
 $('record-status').value=status(a);$('art').textContent=a.art||'Production notes have not been added.';$('motions').replaceChildren(...(a.motions||[]).map(m=>el('span','',m)));
 $('note').value=typeof workspace.notes[a.id]==='string'?workspace.notes[a.id]:'';$('save-status').textContent='Stored locally';
 const images=a.images||[];$('versions').hidden=images.length<2;
 $('versions').replaceChildren(...(images.length<2?[]:images.map((image,i)=>{const b=el('button'),t=new Image();b.type='button';b.setAttribute('aria-label',`Show image ${i+1}: ${image.label}`);t.src=image.thumbSrc||image.src;t.alt='';t.decoding='async';b.append(t,el('span','',image.label));b.addEventListener('click',()=>showImage(i));return b;})));
 showImage(0);updateSaved();updateNav();
 if(!$('record-dialog').open)$('record-dialog').showModal();
}
// Shows image i of the selected record (concept versions/tiles; references have one image).
function showImage(i){
 const a=selected,concept=isConcept(a),images=a.images||[a.image].filter(Boolean);imageIndex=Math.max(0,Math.min(i,images.length-1));const image=images[imageIndex];
 $('reference-image').src=image?.src||'';$('reference-image').alt=a.name+(concept?' concept':' reference');$('reference-image').hidden=!image?.src;$('reference-placeholder').hidden=!!image?.src;$('expand-image').disabled=!image?.src;
 $('image-caption').textContent=!image?.src?'No verified image linked':concept?`${image.label} · ${image.width}×${image.height}`:image.label||'Official reference image';
 const link=concept?originsLinked&&image.origin:image?.source;$('source').hidden=!link;if(link){$('source').href=concept?originRoot+link:link;$('source').textContent=concept?'Original PNG ↗':'View source ↗';}
 if(concept){$('origin-link').textContent=image.origin;if(originsLinked)$('origin-link').href=originRoot+image.origin;else $('origin-link').removeAttribute('href');}
 $('large-image').src=image?.src||'';$('large-image').alt=a.name;$('image-title').textContent=a.name;$('image-dialog').classList.toggle('concept',concept);$('image-zoom').hidden=!concept;
 $('image-credit').textContent=concept?`${gameById[a.game]?.name||'D2RR'} · ${image.label} · ${a.method}`:(gameById[a.game||'diablo-ii']?.name||'')+' · '+(a.image?.label||'Reference image')+' · Rights belong to the respective owners.';
 $('image-index').textContent=images.length>1?`${imageIndex+1} / ${images.length} · ${image.label}`:'';['image-prev','image-next'].forEach(id=>$(id).hidden=images.length<2);$('image-prev').disabled=imageIndex===0;$('image-next').disabled=imageIndex===images.length-1;
 $('versions').querySelectorAll('button').forEach((b,n)=>b.setAttribute('aria-pressed',String(n===imageIndex)));
}
function setZoom(on){$('image-dialog').classList.toggle('actual',on);$('image-zoom').setAttribute('aria-pressed',String(on));$('image-zoom').textContent=on?'Fit to window':'Actual size';}
$('saved').addEventListener('click',()=>{state.saved=true;state.collection='all';resetFilters();render();});
$('search').addEventListener('input',e=>{state.query=e.target.value;render();});['group','kind','status','sort'].forEach(id=>$(id).addEventListener('change',e=>{state[id]=e.target.value;render();}));
$('clear').addEventListener('click',()=>{resetFilters();render();});['grid','table'].forEach(v=>$(v+'-view').addEventListener('click',()=>{state.view=v;render();}));
$('previous').addEventListener('click',()=>{const i=visible.findIndex(a=>a.id===selected?.id);if(i>0)openRecord(visible[i-1].id);});$('next').addEventListener('click',()=>{const i=visible.findIndex(a=>a.id===selected?.id);if(i>=0&&i<visible.length-1)openRecord(visible[i+1].id);});
$('record-save').addEventListener('click',()=>toggleSaved(selected.id));
$('record-status').addEventListener('change',e=>{workspace.statuses[selected.id]=e.target.value;store();render();});
$('note').addEventListener('input',e=>{workspace.notes[selected.id]=e.target.value;$('save-status').textContent=store()?'Saved on this device':'Export to keep a backup';});
$('backup').addEventListener('click',()=>downloadJSON('sanctuary-workspace.json',{schemaVersion:2,exportedAt:new Date().toISOString(),...workspace}));
$('export-catalog').addEventListener('click',()=>downloadJSON('sanctuary-catalog.json',{schemaVersion:2,collections,assets:assets.map(({image,images,...a})=>({...a,status:status(a),image:image?{file:image.file,url:image.url,source:image.source,origin:image.origin}:null,...(images?{images:images.map(({src,thumbSrc,...i})=>i)}:{})}))}));
$('restore').addEventListener('click',()=>$('restore-file').click());
$('restore-file').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>5e6)throw Error('Backup exceeds the 5 MB limit.');const data=JSON.parse(await file.text());if(![1,2].includes(data.schemaVersion)||!data.notes||typeof data.notes!=='object'||Array.isArray(data.notes))throw Error('Choose a valid workspace backup.');for(const [id,value]of Object.entries(data.notes)){if(assetById[id]&&typeof value==='string')workspace.notes[id]=value;}for(const [id,value]of Object.entries(data.statuses||{})){if(assetById[id]&&Object.hasOwn(statusLabels,value))workspace.statuses[id]=value;}workspace.favorites=[...new Set([...workspace.favorites,...(Array.isArray(data.favorites)?data.favorites:[]).filter(id=>Object.hasOwn(assetById,id))])];store();render();toast('Workspace imported. Existing matching notes were updated.');}catch(error){toast(error.message);}e.target.value='';});
['help','scope'].forEach(id=>$(id).addEventListener('click',()=>$('guide-dialog').showModal()));
$('expand-image').addEventListener('click',()=>{setZoom(false);$('image-dialog').showModal();});
$('image-zoom').addEventListener('click',()=>setZoom(!$('image-dialog').classList.contains('actual')));
// Concept sheets: click toggles fit/actual size, keeping the clicked point in view.
$('large-image').addEventListener('click',e=>{if(!isConcept(selected))return;const img=e.currentTarget,r=img.getBoundingClientRect(),fx=(e.clientX-r.left)/r.width,fy=(e.clientY-r.top)/r.height,on=!$('image-dialog').classList.contains('actual');setZoom(on);if(on){const frame=img.parentElement;frame.scrollLeft=fx*img.naturalWidth-frame.clientWidth/2;frame.scrollTop=fy*img.naturalHeight-frame.clientHeight/2;}});
$('image-prev').addEventListener('click',()=>showImage(imageIndex-1));$('image-next').addEventListener('click',()=>showImage(imageIndex+1));
$('image-dialog').addEventListener('keydown',e=>{if($('image-dialog').classList.contains('actual'))return;if(e.key==='ArrowLeft')showImage(imageIndex-1);else if(e.key==='ArrowRight')showImage(imageIndex+1);});
document.querySelectorAll('dialog').forEach(d=>{d.querySelector('.close').addEventListener('click',()=>d.close());d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});});
$('record-dialog').addEventListener('close',resetModel);
const mediaTabs=[...document.querySelectorAll('[data-media]')];mediaTabs.forEach((b,i)=>{b.addEventListener('click',()=>switchMedia(b.dataset.media));b.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const next=mediaTabs[(i+1)%2];switchMedia(next.dataset.media);next.focus();}});});
$('model-file').addEventListener('change',async e=>{
 const file=e.target.files[0];if(!file)return;const seq=++loadSequence;$('model-message').textContent='Loading '+file.name+'…';
 try{if(file.size>100e6)throw Error('Use a GLB smaller than 100 MB.');if(!viewer)viewer=createModelViewer($('model-stage'),(t,d)=>{if(document.activeElement!==$('timeline'))$('timeline').value=String(t);$('time').textContent=`${t.toFixed(2)} / ${d.toFixed(2)} s`;});
 const clips=await viewer.load(file);if(seq!==loadSequence||!clips)return;$('model-empty').hidden=true;$('fit-model').disabled=false;$('model-message').textContent=`${file.name} · ${clips.length} embedded clips · session preview`;
 $('clip').replaceChildren(...clips.map((c,i)=>{const o=el('option','',c.name);o.value=String(i);o.dataset.duration=c.duration;return o;}));$('clip-controls').hidden=!clips.length;$('timeline').max=String(clips[0]?.duration||1);$('timeline').value='0';$('play').textContent='Pause';$('speed').value='1';viewer.speed(1);
 }catch(error){if(seq===loadSequence)$('model-message').textContent='Could not load model: '+error.message;}e.target.value='';
});
$('fit-model').addEventListener('click',()=>viewer?.fit());$('clip').addEventListener('change',e=>{$('timeline').max=String(viewer?.choose(Number(e.target.value))||1);$('timeline').value='0';});$('play').addEventListener('click',()=>{$('play').textContent=viewer?.play()?'Pause':'Play';});$('speed').addEventListener('change',e=>viewer?.speed(Number(e.target.value)));$('timeline').addEventListener('input',e=>viewer?.seek(Number(e.target.value)));
document.addEventListener('keydown',e=>{if(e.key==='/'&&!document.querySelector('dialog[open]')&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();$('search').focus();}});
window.addEventListener('pagehide',resetModel);syncGroupFilter();render();
