import {build} from 'esbuild';
import {readFile,writeFile,mkdir,rm,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {conceptMedia,conceptFiles,conceptUrl} from './concept-media.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
// --site <dir>: also write the website build (index.html plus concepts/*.webp loaded by URL) into <dir>.
const siteFlag=process.argv.indexOf('--site'),siteDir=siteFlag>0?path.resolve(process.argv[siteFlag+1]||''):null;
const bundle=async urlBase=>(await build({entryPoints:[path.join(root,'src/main.js')],bundle:true,minify:true,format:'iife',target:['es2020'],write:false,legalComments:'inline',plugins:[conceptMedia(root,{urlBase})]})).outputFiles[0].text;
const css=await readFile(path.join(root,'src/styles.css'),'utf8');
const template=await readFile(path.join(root,'src/template.html'),'utf8');
// origin-root: the repository root relative to the page, for the concept "Original PNG" links ("none" = no originals).
// Literal replacement callbacks preserve JS dollar sequences and escape closing script tags.
const page=(js,originRoot)=>template.replace('__ORIGIN_ROOT__',()=>originRoot).replace('/*__CSS__*/',()=>css).replace('/*__JS__*/',()=>js.replace(/<\/script/gi,'<\\/script'));
const offline=await bundle();
// legacy/Sanctuary_Databook.html and legacy/Diablo_II_Act1_Bestiary.html are pre-concept snapshots and are no longer rebuilt.
const outputs=[['dist/index.html','../../../'],['../D2RR.html','../']];
await mkdir(path.join(root,'dist'),{recursive:true});
for(const [file,originRoot] of outputs)await writeFile(path.join(root,file),page(offline,originRoot));
console.log('Built offline HTML:',(Buffer.byteLength(page(offline,''))/1024/1024).toFixed(2),'MB →',outputs.map(([file])=>file).join(', '));
if(siteDir){
 const files=await conceptFiles(root),html=page(await bundle('concepts/'),'none');
 await rm(path.join(siteDir,'concepts'),{recursive:true,force:true});
 for(const file of files){const target=path.join(siteDir,conceptUrl(file,'concepts/'));await mkdir(path.dirname(target),{recursive:true});await copyFile(path.join(root,file),target);}
 await writeFile(path.join(siteDir,'index.html'),html);
 console.log('Built website:',(Buffer.byteLength(html)/1024/1024).toFixed(2),'MB index.html +',files.length,'concept images →',siteDir);
}
