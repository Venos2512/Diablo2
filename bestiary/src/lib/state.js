export function normalize(s){return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');}
export function filterMonsters(items,{group='all',kind='all',query=''}){
 const q=normalize(query.trim());
 return items.filter(m=>(group==='all'||m.group===group)&&(kind==='all'||(kind==='special'?m.kind!=='regular':m.kind===kind))&&normalize([m.name,m.description,m.role,m.location].join(' ')).includes(q));
}
const KEY='act1-bestiary-notes-v1';
export function loadNotes(){try {const data=JSON.parse(localStorage.getItem(KEY)||'{}');return data&&typeof data==='object'&&!Array.isArray(data)?data:{};}catch{return {};}}
export function saveNotes(notes){try{localStorage.setItem(KEY,JSON.stringify(notes));return true;}catch{return false;}}
export function exportNotes(notes){
 const blob=new Blob([JSON.stringify({schemaVersion:1,exportedAt:new Date().toISOString(),notes},null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='act1-art-notes.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
