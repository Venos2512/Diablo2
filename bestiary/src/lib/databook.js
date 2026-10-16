import {normalize,loadNotes} from './state.js';
export function readWorkspace(){
 let w={};try{w=JSON.parse(localStorage.getItem('sanctuary-databook-v2')||'{}')||{};}catch{}
 return {notes:{...loadNotes(),...w.notes},favorites:Array.isArray(w.favorites)?w.favorites:[],statuses:w.statuses||{}};
}
export function persist(w){try{localStorage.setItem('sanctuary-databook-v2',JSON.stringify(w));return true;}catch{return false;}}
export function queryAssets(assets,state,workspace){
 const q=normalize(state.query||'');
 return assets.filter(a=>(state.collection==='all'||a.type===state.collection)&&(!state.saved||workspace.favorites.includes(a.id))&&(state.group==='all'||a.group===state.group)&&(state.kind==='all'||a.kind===state.kind)&&(state.status==='all'||(workspace.statuses[a.id]||a.status)===state.status)&&normalize([a.name,a.description,a.role,a.location,...(a.tags||[])].join(' ')).includes(q)).sort((a,b)=>state.sort==='name'?a.name.localeCompare(b.name):state.sort==='type'?a.type.localeCompare(b.type)||a.name.localeCompare(b.name):(a.index||0)-(b.index||0));
}
export function downloadJSON(name,value){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
