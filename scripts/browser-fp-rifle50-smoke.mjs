import { readFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { openBrowserCdpSession } from './browser-cdp-session.mjs';

const expectedBuild=JSON.parse(readFileSync(new URL('../version.json',import.meta.url),'utf8')).build;
const endpoint=process.env.ZAP_CDP_ENDPOINT||'http://127.0.0.1:9222/json/list';

function browserProbe(){
  const build=document.querySelector('meta[name="application-build"]')?.content||'';
  const scripts=[...document.scripts].map(s=>s.src||'').filter(src=>
    src.includes('/assets/weapons/models/zap-fp-rifle-50.runtime.js')||
    src.includes('/src/weapons/first-person-rifle-model3d.js')||
    src.includes('/src/weapons/system.js')
  );
  const model=createFirstPersonRifleModel50();
  model?.updateMatrixWorld(true);
  const bounds=model?new THREE.Box3().setFromObject(model):null;
  const parts=model?.userData?.rifle50Parts||{};
  const rest=model?.userData?.rifle50Rest||{};
  const baseline={
    boltZ:parts.bolt?.position.z,
    magY:parts.magazine?.position.y,
    magZ:parts.magazine?.position.z,
    leftY:parts.leftArm?.position.y
  };
  updateFirstPersonRifleModel50(model,{recoil:.8,reloading:false,reloadProgress:0,cycle:.5,shotSequence:3});
  const recoilState={boltZ:parts.bolt?.position.z,rightZ:parts.rightArm?.position.z};
  updateFirstPersonRifleModel50(model,{recoil:0,reloading:true,reloadProgress:.30,cycle:0,shotSequence:3});
  const reloadState={magY:parts.magazine?.position.y,magZ:parts.magazine?.position.z,leftY:parts.leftArm?.position.y};

  buildGun(WEAPON_BY_KEY.rifle);
  const previousRunning=running,previousPaused=paused;
  running=true;paused=true;
  syncGeneratedFirstPersonWeaponArt(true);
  const live=gunGrp.userData.firstPersonRifle50;
  live?.updateMatrixWorld(true);
  const liveBounds=live?new THREE.Box3().setFromObject(live):null;
  const wrap=G('fp-weapon-art-wrap');
  const liveState={
    pack:live?.userData?.packVersion||0,
    blender:live?.userData?.blenderFirstPersonRifle50===true,
    generatedActive:!!fpGeneratedWeaponActive,
    generatedLoading:!!fpGeneratedWeaponLoading,
    generatedShown:!!wrap?.classList.contains('shown'),
    muzzle:live?.userData?.muzzleZ??0,
    width:liveBounds?liveBounds.max.x-liveBounds.min.x:0,
    height:liveBounds?liveBounds.max.y-liveBounds.min.y:0,
    depth:liveBounds?liveBounds.max.z-liveBounds.min.z:0
  };
  running=previousRunning;paused=previousPaused;

  if(model)disposeObject3D(model);
  const result={
    build,
    version:window.ZAP_FP_RIFLE_50?.version||0,
    available:typeof firstPersonRifle50Available==='function'&&firstPersonRifle50Available(),
    components:Object.keys(window.ZAP_FP_RIFLE_50?.components||{}),
    bounds:bounds?{
      width:bounds.max.x-bounds.min.x,
      height:bounds.max.y-bounds.min.y,
      depth:bounds.max.z-bounds.min.z
    }:null,
    baseline,recoilState,reloadState,liveState,
    staleScripts:scripts.filter(src=>!src.includes('?v='+build))
  };
  result.ok=result.version===50&&result.available&&result.components.length===5&&
    result.bounds&&result.bounds.width>0&&result.bounds.height>0&&result.bounds.depth>result.bounds.height&&
    Number.isFinite(baseline.boltZ)&&recoilState.boltZ>baseline.boltZ+.03&&
    reloadState.magY<baseline.magY-.05&&reloadState.magZ>baseline.magZ+.02&&reloadState.leftY<baseline.leftY-.03&&
    liveState.pack===50&&liveState.blender&&!liveState.generatedActive&&!liveState.generatedLoading&&!liveState.generatedShown&&
    liveState.muzzle<-1.5&&liveState.width>0&&liveState.height>0&&liveState.depth>liveState.height&&
    result.staleScripts.length===0;
  return result;
}

async function run(mode){
  const fileMode=mode==='file';
  const session=await openBrowserCdpSession({
    endpoint,
    waitMs:Math.max(1000,Number(process.env.ZAP_CDP_WAIT_MS)||15000),
    pageMatches:page=>fileMode
      ? page.url.startsWith('file:///')&&page.url.includes('/ZAP_ZONE/index.html')
      : page.url.startsWith('http://127.0.0.1:8000'),
    pageUnavailableMessage:({waitMs,endpoint,lastError})=>'Pack50 '+mode+' smoke: page unavailable after '+waitMs+'ms; endpoint='+endpoint+'; last='+lastError,
    websocketTimeoutMessage:'Pack50 '+mode+' smoke: CDP websocket timeout',
    websocketErrorMessage:'Pack50 '+mode+' smoke: CDP websocket failed'
  });
  const {send}=session;
  async function evaluate(expression){
    const r=await send('Runtime.evaluate',{expression,returnByValue:true});
    if(r.exceptionDetails)throw new Error('Pack50 '+mode+' evaluate failed: '+JSON.stringify(r.exceptionDetails));
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
      if(boot==='failed')throw new Error('Pack50 '+mode+' boot failed after reload');
      await sleep(150);
    }
    if(boot!=='ready')throw new Error('Pack50 '+mode+' boot timeout after reload');
    await sleep(700);
    const state=await evaluate('('+browserProbe.toString()+')()');
    if(state.build!==expectedBuild)throw new Error('Pack50 '+mode+' stale build after reload: expected '+expectedBuild+', got '+state.build);
    if(!state.ok)throw new Error('Pack50 '+mode+' runtime contract failed: '+JSON.stringify(state));
    if(session.hasFatalDiagnostics())throw new Error('Pack50 '+mode+' fatal browser diagnostics: '+JSON.stringify(session.fatalDiagnosticsTail()));
    console.log('Pack50 '+mode+' browser smoke passed:',JSON.stringify({...state,diagnostics:session.diagnosticsTail()}));
  }finally{
    session.close();
  }
}

for(const mode of ['http','file'])await run(mode);
