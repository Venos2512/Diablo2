// Original project concept art: the D2RR world. Records are written by scripts/import_concepts.py
// from assets/CONCEPT_SOURCES.json; the WebP bytes are inlined at build time (scripts/concept-media.mjs).
import data from './concepts.json' with {type:'json'};
import media from 'concept-media';
export const conceptWorld=data.world;
export const conceptGroups=data.groups;
export const conceptGroupById=Object.fromEntries(conceptGroups.map(group=>[group.id,group]));
export const concepts=data.records.map(record=>{
 const images=record.images.map(image=>({...image,src:media[image.file],thumbSrc:media[image.thumb]}));
 return {...record,type:'concept',game:conceptWorld.id,images,image:images[0],media:{model:null,clips:[]},motions:[]};
});
