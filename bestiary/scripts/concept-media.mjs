// esbuild plugin: the virtual module "concept-media" maps every WebP listed in src/data/concepts.json either to a
// data URI (offline single-file build) or, with urlBase, to a relative URL under urlBase (website build, where the
// files are copied next to index.html and load lazily).
import {readFile} from 'node:fs/promises';
import path from 'node:path';
export async function conceptFiles(root){
 const data=JSON.parse(await readFile(path.join(root,'src/data/concepts.json'),'utf8'));
 return [...new Set(data.records.flatMap(r=>r.images.flatMap(i=>[i.file,i.thumb])))];
}
export const conceptUrl=(file,urlBase)=>urlBase+file.replace(/^assets\/concepts\//,'');
export function conceptMedia(root,{urlBase}={}){
 return {name:'concept-media',setup(build){
  build.onResolve({filter:/^concept-media$/},()=>({path:'concept-media',namespace:'concept-media'}));
  build.onLoad({filter:/.*/,namespace:'concept-media'},async()=>{
   const files=await conceptFiles(root),media={};
   for(const file of files)media[file]=urlBase!==undefined?conceptUrl(file,urlBase):'data:image/webp;base64,'+(await readFile(path.join(root,file))).toString('base64');
   return {contents:JSON.stringify(media),loader:'json',watchFiles:[path.join(root,'src/data/concepts.json'),...files.map(f=>path.join(root,f))]};
  });
 }};
}
