import { readFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { openBrowserCdpSession } from './browser-cdp-session.mjs';

const expectedBuild=JSON.parse(readFileSync(new URL('../version.json',import.meta.url),'utf8')).build;
const mode=process.env.ZAP_FLOOR48_MODE==='file'?'file':'http';
const endpoint=process.env.ZAP_CDP_ENDPOINT||'http://127.0.0.1:9222/json/list';
const prefix=mode==='file'?'file://':'http://127.0.0.1:8000';
const session=await openBrowserCdpSession({
  endpoint,
  waitMs:Math.max(1000,Number(process.env.ZAP_CDP_WAIT_MS)||15000),
  pageMatches:page=>page.url.startsWith(prefix),
  pageUnavailableMessage:({waitMs,endpoint,lastError})=>'Legacy floor '+mode+' smoke: page unavailable after '+waitMs+'ms; endpoint='+endpoint+'; last='+lastError,
  websocketTimeoutMessage:'Legacy floor '+mode+' smoke: CDP websocket timeout',
  websocketErrorMessage:'Legacy floor '+mode+' smoke: CDP websocket failed'
});
const {send}=session;
async function evaluate(expression){
  const r=await send('Runtime.evaluate',{expression,returnByValue:true});
  if(r.exceptionDetails)throw new Error('Legacy floor '+mode+' evaluate failed: '+JSON.stringify(r.exceptionDetails));
  return r.result?.value;
}
try{
  await send('Page.enable');
  await send('Page.reload',{ignoreCache:true});
  const deadline=Date.now()+20000;
  let boot='';
  while(Date.now()<deadline){
    try{boot=await evaluate("document.documentElement.dataset.zapBoot||''");}catch{}
    if(boot==='ready')break;
    if(boot==='failed')throw new Error('Legacy floor '+mode+' boot failed');
    await sleep(120);
  }
  if(boot!=='ready')throw new Error('Legacy floor '+mode+' boot timeout after reload');
  await sleep(700);

  const state=await evaluate(`(()=>{
    if(typeof scene==='undefined'||typeof arenaFloor==='undefined'||typeof wallMeshes==='undefined'){
      return {ok:false,reason:'missing-runtime-globals'};
    }
    const floorPieces=[];
    scene.traverse(o=>{if(o?.userData?.floorPresentation48)floorPieces.push(o);});
    const material=Array.isArray(arenaFloor.material)?arenaFloor.material[0]:arenaFloor.material;
    const scripts=[...document.scripts].map(s=>s.src||'');
    const groundHit=firstGroundHitDistance(new THREE.Vector3(0,1,0),new THREE.Vector3(0,-1,0),10);
    const build=document.querySelector('meta[name="application-build"]')?.content||'';
    const result={
      build,
      pack48Global:typeof window.ZAP_FLOOR_KIT_48,
      pack48InstallHook:typeof installFloorKit48Presentation,
      pack48LodHook:typeof updateFloorKit48Lod,
      floorPresentationPieces:floorPieces.length,
      floorY:arenaFloor.position.y,
      floorVisible:arenaFloor.visible,
      colorWrite:material?.colorWrite,
      depthWrite:material?.depthWrite,
      receiveShadow:arenaFloor.receiveShadow,
      floorColor:material?.color?.getHex?.(),
      roughness:material?.roughness,
      metalness:material?.metalness,
      groundHit,
      pack48ScriptLoaded:scripts.some(src=>src.includes('zap-floor-modular-48.runtime.js')||src.includes('floor-kit3d.js'))
    };
    result.ok=result.pack48Global==='undefined'&&result.pack48InstallHook==='undefined'&&result.pack48LodHook==='undefined'&&
      result.floorPresentationPieces===0&&!result.pack48ScriptLoaded&&result.floorVisible===true&&
      result.colorWrite===true&&result.depthWrite===true&&result.receiveShadow===true&&
      result.floorColor===0x202833&&Math.abs(result.roughness-.96)<1e-9&&result.metalness===0&&
      Math.abs(result.floorY+.04)<1e-9&&Math.abs(result.groundHit-1.04)<1e-6;
    return result;
  })()`);
  if(state?.build!==expectedBuild)throw new Error('Legacy floor '+mode+' stale build after reload: expected '+expectedBuild+', got '+state?.build);
  if(!state?.ok)throw new Error('Legacy floor '+mode+' contract failed: '+JSON.stringify(state));
  if(session.hasFatalDiagnostics())throw new Error('Legacy floor '+mode+' fatal browser diagnostics: '+JSON.stringify(session.fatalDiagnosticsTail()));
  console.log('Legacy floor '+mode+' browser smoke passed:',JSON.stringify({...state,diagnostics:session.diagnosticsTail()}));
}finally{
  session.close();
}
