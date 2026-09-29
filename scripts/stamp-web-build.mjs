import { readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';

const root=resolve(import.meta.dirname,'..');
const indexPath=resolve(root,'index.html');
const cssPath=resolve(root,'src/styles/game.css');
const manifestPath=resolve(root,'version.json');
const buildPattern=/^[0-9a-f]{16}$/;

async function walk(dir){
  const entries=await readdir(dir,{withFileTypes:true});
  const files=[];
  for(const entry of entries){
    const full=resolve(dir,entry.name);
    if(entry.isDirectory())files.push(...await walk(full));
    else if(entry.isFile())files.push(full);
  }
  return files;
}
function rel(path){return relative(root,path).split(sep).join('/');}
function normalizeIndex(text){
  return text
    .replace(/(<meta name="application-build" content=")[^"]*(")/,'$1__BUILD__$2')
    .replace(/(href="src\/styles\/game\.css)(?:\?v=(?:[0-9a-f]{16}|__BUILD__))?(")/,'$1?v=__BUILD__$2');
}
function normalizeCss(text){
  return text.replace(/\?v=(?:[0-9a-f]{16}|__BUILD__)(?=['")])/g,'?v=__BUILD__');
}
function gitBlobSha(bytes){
  const header=Buffer.from('blob '+bytes.length+'\0');
  return createHash('sha1').update(header).update(bytes).digest('hex');
}
function hashBuild(entries){
  let hash=0xcbf29ce484222325n;
  const prime=0x100000001b3n;
  const step=value=>{
    hash^=BigInt(value&0xff);hash=BigInt.asUintN(64,hash*prime);
    hash^=BigInt((value>>>8)&0xff);hash=BigInt.asUintN(64,hash*prime);
  };
  for(const entry of entries){
    const part=entry.path+'\n'+entry.sha;
    for(let i=0;i<part.length;i+=1)step(part.charCodeAt(i));
    step(0xffff);
  }
  return hash.toString(16).padStart(16,'0');
}

const [indexSource,cssSource]=await Promise.all([readFile(indexPath,'utf8'),readFile(cssPath,'utf8')]);
const runtimeFiles=[
  ...await walk(resolve(root,'src')),
  ...await walk(resolve(root,'assets')),
].sort((a,b)=>rel(a).localeCompare(rel(b)));
const entries=[{path:'index.html',sha:gitBlobSha(Buffer.from(normalizeIndex(indexSource),'utf8'))}];
for(const path of runtimeFiles){
  const relativePath=rel(path);
  const bytes=relativePath==='src/styles/game.css'
    ? Buffer.from(normalizeCss(cssSource),'utf8')
    : await readFile(path);
  entries.push({path:relativePath,sha:gitBlobSha(bytes)});
}
entries.sort((a,b)=>a.path.localeCompare(b.path));
const build=hashBuild(entries);
const versionMatch=indexSource.match(/<meta name="application-version" content="([^"]+)">/);
if(!versionMatch)throw new Error('application-version meta marker is missing from index.html');
const version=versionMatch[1];
const expectedIndex=normalizeIndex(indexSource).replaceAll('__BUILD__',build);
const expectedCss=normalizeCss(cssSource).replaceAll('__BUILD__',build);
const expectedManifest=JSON.stringify({version,build},null,2)+'\n';

if(process.argv.includes('--check')){
  const actualManifest=await readFile(manifestPath,'utf8').catch(()=> '');
  const errors=[];
  if(!buildPattern.test(build))errors.push('computed build id is invalid');
  if(indexSource!==expectedIndex)errors.push('index.html build/cache key is stale; run node scripts/stamp-web-build.mjs');
  if(cssSource!==expectedCss)errors.push('src/styles/game.css asset cache keys are stale; run node scripts/stamp-web-build.mjs');
  if(actualManifest!==expectedManifest)errors.push('version.json is stale; run node scripts/stamp-web-build.mjs');
  if(errors.length){
    console.error('BUILD STAMP EXPECTED:',build);
    for(const error of errors)console.error('BUILD STAMP ERROR:',error);
    process.exit(1);
  }
  console.log('Web build stamp is current:',build);
}else{
  await Promise.all([
    writeFile(indexPath,expectedIndex,'utf8'),
    writeFile(cssPath,expectedCss,'utf8'),
    writeFile(manifestPath,expectedManifest,'utf8'),
  ]);
  console.log('Stamped web build:',build);
}
