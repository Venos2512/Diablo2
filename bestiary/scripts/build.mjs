import {build} from 'esbuild';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const result=await build({entryPoints:[path.join(root,'src/main.js')],bundle:true,minify:true,format:'iife',target:['es2020'],write:false,legalComments:'inline'});
const css=await readFile(path.join(root,'src/styles.css'),'utf8');
let html=await readFile(path.join(root,'src/template.html'),'utf8');
// Literal replacement callbacks preserve JS dollar sequences and escape closing script tags.
html=html.replace('/*__CSS__*/',()=>css).replace('/*__JS__*/',()=>result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script'));
await mkdir(path.join(root,'dist'),{recursive:true});
await writeFile(path.join(root,'dist/index.html'),html);
await writeFile(path.join(root,'../Diablo_II_Act1_Bestiary.html'),html);
await writeFile(path.join(root,'../Sanctuary_Databook.html'),html);
console.log('Built offline HTML:',(Buffer.byteLength(html)/1024/1024).toFixed(2),'MB');
