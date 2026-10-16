import {assets,collections,collectionById,assetById} from './data/registry.js';
import {groups,groupById} from './data/catalog.js';
import {readWorkspace,persist,queryAssets,downloadJSON} from './lib/databook.js';
import {createModelViewer} from './viewer/model.js';

const $=id=>document.getElementById(id),workspace=readWorkspace();
const state={collection:'all',group:'all',kind:'all',status:'all',sort:'catalog',query:'',saved:false,view:'grid'};
const statusLabels={reference:'Reference',todo:'To do',progress:'In progress',approved:'Approved'};
let visible=[],selected=null,viewer=null,toastTimer,loadSequence=0;
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const countType=id=>id==='all'?assets.length:assets.filter(a=>a.type===id).length;
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3500);}
function store(){const ok=persist(workspace);if(!ok)toast('Storage is unavailable. Export your workspace to keep a backup.');return ok;}
function status(a){return workspace.statuses[a.id]||a.status||'reference';}
function saved(id){return workspace.favorites.includes(id);}
function toggleSaved(id){workspace.favorites=saved(id)?workspace.favorites.filter(x=>x!==id):[...workspace.favorites,id];store();render();if(selected?.id===id)updateSaved();}
function updateSaved(){const on=saved(selected.id);$('record-save').textContent=on?'★':'☆';$('record-save').setAttribute('aria-pressed',String(on));$('record-save').setAttribute('aria-label',on?'Remove saved asset':'Save asset');}

collections.forEach(c=>{const b=el('button','nav-button');b.dataset.collection=c.id;b.append(el('span','nav-icon',c.symbol),el('span','',c.name),el('span','count',String(countType(c.id))));b.addEventListener('click',()=>{state.collection=c.id;state.saved=false;resetFilters();render();});$('collections').append(b);});
groups.forEach(g=>{const option=el('option','',g.name);option.value=g.id;$('group').append(option);});
$('total').textContent=assets.length;$('reference-total').textContent=assets.filter(a=>a.image?.src).length;$('model-total').textContent=assets.filter(a=>a.media?.model).length;$('clip-total').textContent=assets.reduce((n,a)=>n+(a.media?.clips?.length||0),0);
function resetFilters(){Object.assign(state,{group:'all',kind:'all',status:'all',query:''});['group','kind','status'].forEach(id=>$(id).value='all');$('search').value='';}
function makeStatus(a){return el('span','status '+status(a),statusLabels[status(a)]||'Reference');}
function thumbnail(a){const i=new Image();if(a.image?.src)i.src=a.image.src;i.alt=a.name;i.loading='lazy';return i;}
function makeCard(a){
 const card=el('article','asset-card '+(a.kind||''));const b=el('button','asset-open');b.setAttribute('aria-label','Open '+a.name);
 const picture=el('div','thumb');picture.append(thumbnail(a),el('span','thumb-label',a.kind==='boss'?'ACT BOSS':a.kind==='unique'?'UNIQUE':collectionById[a.type]?.name.toUpperCase()||'ASSET'));
 const copy=el('div','card-copy');copy.append(el('h2','',a.name),el('p','',groupById[a.group]?.name||a.role||collectionById[a.type]?.name));const meta=el('div','card-meta');meta.append(el('span','',a.act||'Unassigned'),makeStatus(a));copy.append(meta);b.append(picture,copy);b.addEventListener('click',()=>openRecord(a.id));
 const favorite=el('button','favorite',saved(a.id)?'★':'☆');favorite.setAttribute('aria-label',(saved(a.id)?'Unsave ':'Save ')+a.name);favorite.setAttribute('aria-pressed',String(saved(a.id)));favorite.addEventListener('click',()=>toggleSaved(a.id));card.append(b,favorite);return card;
}
function makeRow(a){const tr=el('tr');const first=el('td'),button=el('button','table-asset');button.setAttribute('aria-label','Open '+a.name);const text=el('span','',a.name);text.append(el('small','',a.id));button.append(thumbnail(a),text);button.addEventListener('click',()=>openRecord(a.id));first.append(button);const type=el('td','',collectionById[a.type]?.name||a.type);type.append(el('small','',groupById[a.group]?.name||''));const s=el('td');s.append(makeStatus(a));const f=el('td'),fav=el('button','table-save',saved(a.id)?'★':'☆');fav.setAttribute('aria-label',(saved(a.id)?'Unsave ':'Save ')+a.name);fav.setAttribute('aria-pressed',String(saved(a.id)));fav.addEventListener('click',()=>toggleSaved(a.id));f.append(fav);tr.append(first,type,el('td','',a.role||'—'),el('td','',a.media?.model?'3D model':a.image?.src?'Image reference':'Not linked'),s,f);return tr;}
function render(){
 visible=queryAssets(assets,state,workspace);const collection=collectionById[state.collection];
 document.querySelectorAll('[data-collection]').forEach(b=>{const active=b.dataset.collection===state.collection&&!state.saved;b.classList.toggle('active',active);b.setAttribute('aria-current',active?'page':'false');});
 $('saved').classList.toggle('active',state.saved);$('saved-count').textContent=workspace.favorites.filter(id=>assetById[id]).length;
 const title=state.saved?'Saved assets':collection.name;$('title').replaceChildren(document.createTextNode(title),el('span','','.'));$('crumb').textContent=title;$('subtitle').textContent=state.saved?'Your shortlist of references and production assets.':collection.description;
 const supportsCreatures=['all','creature'].includes(state.collection);$('group').hidden=!supportsCreatures;$('kind').hidden=!supportsCreatures;
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
 selected=assetById[id];if(!selected)return;const a=selected;resetModel();switchMedia('reference');
 $('record-code').textContent=`${collectionById[a.type]?.name||'ASSET'} / ${String(a.index||assets.indexOf(a)+1).padStart(3,'0')}`;
 $('record-family').textContent=groupById[a.group]?.name||a.type;$('record-name').textContent=a.name;$('description').textContent=a.description||'Description not added yet.';
 $('record-tags').replaceChildren(...[a.act,a.role,a.kind==='boss'?'Act boss':a.kind==='unique'?'Unique enemy':null].filter(Boolean).map(t=>el('span','',t)));
 $('record-type').textContent=collectionById[a.type]?.name||a.type;$('location').textContent=a.location||'Not documented';$('base').textContent=a.base||'No base reference linked';
 $('record-status').value=status(a);$('art').textContent=a.art||'Production notes have not been added.';$('motions').replaceChildren(...(a.motions||[]).map(m=>el('span','',m)));
 $('note').value=typeof workspace.notes[a.id]==='string'?workspace.notes[a.id]:'';$('save-status').textContent='Stored locally';
 $('reference-image').src=a.image?.src||'';$('reference-image').alt=a.name+' reference';$('reference-image').hidden=!a.image?.src;$('expand-image').disabled=!a.image?.src;
 $('image-caption').textContent=a.image?.src?'Image reference · see source':'No image reference linked';$('source').hidden=!a.image?.source;if(a.image?.source)$('source').href=a.image.source;
 $('large-image').src=a.image?.src||'';$('large-image').alt=a.name;$('image-title').textContent=a.name;updateSaved();updateNav();
 if(!$('record-dialog').open)$('record-dialog').showModal();
}
$('saved').addEventListener('click',()=>{state.saved=true;state.collection='all';resetFilters();render();});
$('search').addEventListener('input',e=>{state.query=e.target.value;render();});['group','kind','status','sort'].forEach(id=>$(id).addEventListener('change',e=>{state[id]=e.target.value;render();}));
$('clear').addEventListener('click',()=>{resetFilters();render();});['grid','table'].forEach(v=>$(v+'-view').addEventListener('click',()=>{state.view=v;render();}));
$('previous').addEventListener('click',()=>{const i=visible.findIndex(a=>a.id===selected?.id);if(i>0)openRecord(visible[i-1].id);});$('next').addEventListener('click',()=>{const i=visible.findIndex(a=>a.id===selected?.id);if(i>=0&&i<visible.length-1)openRecord(visible[i+1].id);});
$('record-save').addEventListener('click',()=>toggleSaved(selected.id));
$('record-status').addEventListener('change',e=>{workspace.statuses[selected.id]=e.target.value;store();render();});
$('note').addEventListener('input',e=>{workspace.notes[selected.id]=e.target.value;$('save-status').textContent=store()?'Saved on this device':'Export to keep a backup';});
$('backup').addEventListener('click',()=>downloadJSON('sanctuary-workspace.json',{schemaVersion:2,exportedAt:new Date().toISOString(),...workspace}));
$('export-catalog').addEventListener('click',()=>downloadJSON('sanctuary-catalog.json',{schemaVersion:2,collections,assets:assets.map(({image,...a})=>({...a,status:status(a),image:image?{file:image.file,url:image.url,source:image.source}:null}))}));
$('restore').addEventListener('click',()=>$('restore-file').click());
$('restore-file').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>5e6)throw Error('Backup exceeds the 5 MB limit.');const data=JSON.parse(await file.text());if(![1,2].includes(data.schemaVersion)||!data.notes||typeof data.notes!=='object'||Array.isArray(data.notes))throw Error('Choose a valid workspace backup.');for(const [id,value]of Object.entries(data.notes)){if(assetById[id]&&typeof value==='string')workspace.notes[id]=value;}for(const [id,value]of Object.entries(data.statuses||{})){if(assetById[id]&&Object.hasOwn(statusLabels,value))workspace.statuses[id]=value;}workspace.favorites=[...new Set([...workspace.favorites,...(Array.isArray(data.favorites)?data.favorites:[]).filter(id=>Object.hasOwn(assetById,id))])];store();render();toast('Workspace imported. Existing matching notes were updated.');}catch(error){toast(error.message);}e.target.value='';});
['help','scope'].forEach(id=>$(id).addEventListener('click',()=>$('guide-dialog').showModal()));
$('expand-image').addEventListener('click',()=>$('image-dialog').showModal());
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
window.addEventListener('pagehide',resetModel);render();
