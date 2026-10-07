import { readFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { openBrowserCdpSession } from './browser-cdp-session.mjs';

const expectedBuild=JSON.parse(readFileSync(new URL('../version.json',import.meta.url),'utf8')).build;
const endpoint=process.env.ZAP_CDP_ENDPOINT||'http://127.0.0.1:9222/json/list';

function browserProbe(){
  const keys=['pistol','shotgun','rifle','plasma','sniper','rocket'];
  const build=document.querySelector('meta[name="application-build"]')?.content||'';
  const scripts=[...document.scripts].map(s=>s.src||'').filter(src=>
    src.includes('/assets/weapons/models/zap-world-weapons-49.runtime.js')||
    src.includes('/src/weapons/world-weapon-model3d.js')||
    src.includes('/src/weapons/system.js')
  );
  const models=[];
  for(const key of keys){
    const model=createWorldWeaponModel49(key,{mode:'bot',team:'ally',accentColor:0x5ab2ff});
    model?.updateMatrixWorld(true);
    const bounds=model?new THREE.Box3().setFromObject(model):null;
    models.push({
      key,
      ok:!!model,
      pack:model?.userData?.packVersion||0,
      blender:!!model?.userData?.blenderWorldWeapon49,
      meshes:model?model.children.filter(x=>x.isMesh).length:0,
      width:bounds?bounds.max.x-bounds.min.x:0,
      height:bounds?bounds.max.y-bounds.min.y:0,
      depth:bounds?bounds.max.z-bounds.min.z:0,
      muzzle:model?.userData?.muzzleZ??0
    });
    if(model)disposeObject3D(model);
  }

  const pickupCases=keys.map(key=>{
    const pickup=mkWeaponPickupMesh(key);
    const result={
      key,
      blender:pickup.userData.blenderWorldWeapon49===true,
      domArt:!!pickup.userData.worldPickupArt,
      presentation:!!pickup.userData.pickupPresentation,
      visible:pickup.userData.pickupPresentation?.model?.visible!==false
    };
    disposeObject3D(pickup);
    return result;
  });

  let bot=null;
  const botCases=[];
  try{
    bot=new Enemy(0,0,1,'ally');
    for(const key of keys){
      bot.weapon={key};
      refreshBotWeaponVisual(bot);
      botCases.push({
        key,
        blender:bot.weaponMesh?.userData?.blenderWorldWeapon49===true,
        pack:bot.weaponMesh?.userData?.packVersion||0,
        poseKey:bot.weaponPivot?.userData?.weaponKey||''
      });
    }
  }finally{
    if(bot)bot.destroy();
  }

  const fp=createWeaponModel('rifle',{mode:'firstPerson',detail:2});
  const firstPersonExcluded=fp?.userData?.blenderWorldWeapon49!==true;
  if(fp)disposeObject3D(fp);

  const result={
    build,
    version:window.ZAP_WORLD_WEAPONS_49?.version||0,
    componentCount:Object.keys(window.ZAP_WORLD_WEAPONS_49?.components||{}).length,
    available:typeof worldWeapon49Available==='function'&&worldWeapon49Available(),
    models,pickupCases,botCases,firstPersonExcluded,
    staleScripts:scripts.filter(src=>!src.includes('?v='+build))
  };
  result.ok=result.version===49&&result.componentCount===6&&result.available&&result.firstPersonExcluded&&
    models.every(x=>x.ok&&x.blender&&x.pack===49&&x.meshes===1&&x.width>0&&x.height>0&&x.depth>x.height*1.10&&x.muzzle<0)&&
    pickupCases.every(x=>x.blender&&!x.domArt&&x.presentation&&x.visible)&&
    botCases.every(x=>x.blender&&x.pack===49&&x.poseKey===x.key)&&
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
    pageUnavailableMessage:({waitMs,endpoint,lastError})=>'Pack49 '+mode+' smoke: page unavailable after '+waitMs+'ms; endpoint='+endpoint+'; last='+lastError,
    websocketTimeoutMessage:'Pack49 '+mode+' smoke: CDP websocket timeout',
    websocketErrorMessage:'Pack49 '+mode+' smoke: CDP websocket failed'
  });
  const {send}=session;
  async function evaluate(expression){
    const r=await send('Runtime.evaluate',{expression,returnByValue:true});
    if(r.exceptionDetails)throw new Error('Pack49 '+mode+' evaluate failed: '+JSON.stringify(r.exceptionDetails));
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
      if(boot==='failed')throw new Error('Pack49 '+mode+' boot failed after reload');
      await sleep(150);
    }
    if(boot!=='ready')throw new Error('Pack49 '+mode+' boot timeout after reload');
    await sleep(900);

    const state=await evaluate('('+browserProbe.toString()+')()');
    if(state.build!==expectedBuild)throw new Error('Pack49 '+mode+' stale build after reload: expected '+expectedBuild+', got '+state.build);
    if(!state.ok)throw new Error('Pack49 '+mode+' runtime contract failed: '+JSON.stringify(state));
    if(session.hasFatalDiagnostics())throw new Error('Pack49 '+mode+' fatal browser diagnostics: '+JSON.stringify(session.fatalDiagnosticsTail()));
    console.log('Pack49 '+mode+' browser smoke passed:',JSON.stringify({...state,diagnostics:session.diagnosticsTail()}));
  }finally{
    session.close();
  }
}

for(const mode of ['http','file'])await run(mode);
