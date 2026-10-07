import { readFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { openBrowserCdpSession } from './browser-cdp-session.mjs';

const expectedBuild=JSON.parse(readFileSync(new URL('../version.json',import.meta.url),'utf8')).build;
const endpoint=process.env.ZAP_CDP_ENDPOINT||'http://127.0.0.1:9222/json/list';
const session=await openBrowserCdpSession({
  endpoint,
  waitMs:Math.max(1000,Number(process.env.ZAP_CDP_WAIT_MS)||15000),
  pageMatches:page=>page.url.startsWith('http://127.0.0.1:8000'),
  pageUnavailableMessage:({waitMs,endpoint,lastError})=>'Pack46 HTTP smoke: page unavailable after '+waitMs+'ms; endpoint='+endpoint+'; last='+lastError,
  websocketTimeoutMessage:'Pack46 HTTP smoke: CDP websocket timeout',
  websocketErrorMessage:'Pack46 HTTP smoke: CDP websocket failed'
});
const {send}=session;
async function evaluate(expression){
  const r=await send('Runtime.evaluate',{expression,returnByValue:true});
  if(r.exceptionDetails)throw new Error('Pack46 HTTP evaluate failed: '+JSON.stringify(r.exceptionDetails));
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
    if(boot==='failed')throw new Error('Pack46 HTTP boot failed after reload');
    await sleep(150);
  }
  if(boot!=='ready')throw new Error('Pack46 HTTP boot timeout after reload');
  await sleep(900);
  const state=await evaluate(`(()=>{
    const required=['ZAP_Head','ZAP_Torso','ZAP_Pelvis','ZAP_Shoulder','ZAP_UpperArm','ZAP_Forearm','ZAP_Hand','ZAP_Thigh','ZAP_Shin','ZAP_Foot','ZAP_Role_Assault','ZAP_Role_Sniper','ZAP_Role_Engineer','ZAP_Role_Anchor','ZAP_Role_Flanker'];
    const build=document.querySelector('meta[name="application-build"]')?.content||'';
    const localScripts=[...document.scripts].map(s=>s.src||'').filter(src=>src.includes('/src/')||src.includes('/assets/characters/models/zap-bot-modular-46.runtime.js'));
    let probe=null;
    try{
      probe=new Enemy(0,0,1,'ally');
      const cases=[
        ['assault','rifle','assault'],
        ['engineer','plasma','engineer'],
        ['anchor','rifle','anchor'],
        ['flankL','pistol','flanker'],
        ['anchor','sniper','sniper']
      ];
      const roleCases=cases.map(([role,weapon,expected])=>{
        probe.role=role;probe.weapon={key:weapon};syncBotModel46RoleVariant(probe);
        const visible=Object.entries(probe.model46?.roleModules||{}).filter(([,m])=>m?.visible).map(([k])=>k);
        return {role,weapon,expected,variant:probe.model46?.roleVariant||'',visible};
      });
      probe.aiState='cover';probe.reloadT=1;probe.suppressedT=.4;probe.landingCompression=1;probe.fireBurstRecoil=.8;
      const beforeY=probe.weaponPivot.position.y;
      updateBotMechanicalPresentation(probe,{targetPos:new THREE.Vector3(8,0,8),combatPose:true,strafeRoll:.04,bodyLean:.03,dt:.1});
      const mechanical={
        parts:Object.keys(probe.model46||{}).length,
        headDelta:probe.model46?.head?.rotation.y-Math.PI,
        torsoDelta:probe.model46?.torso?.rotation.y-Math.PI,
        reload:probe.visualReloadBlend,crouch:probe.visualCrouchBlend,landing:probe.landingCompression,
        weaponLowered:probe.weaponPivot.position.y<beforeY,
        shoulderSplit:probe.model46?.rightShoulder?.rotation.x<probe.model46?.leftShoulder?.rotation.x
      };
      const result={
        build,version:window.ZAP_BOT_MODEL_46?.version||0,componentCount:Object.keys(window.ZAP_BOT_MODEL_46?.components||{}).length,
        missingRequired:required.filter(n=>!window.ZAP_BOT_MODEL_46?.components?.[n]),
        mechanicalOwner:typeof updateBotMechanicalPresentation,roleSyncOwner:typeof syncBotModel46RoleVariant,
        roleCases,mechanical,
        staleScripts:localScripts.filter(src=>!src.includes('?v='+build))
      };
      result.ok=result.version===46&&result.componentCount===15&&result.missingRequired.length===0&&result.mechanicalOwner==='function'&&result.roleSyncOwner==='function'&&
        roleCases.every(r=>r.variant===r.expected&&r.visible.length===1&&r.visible[0]===r.expected)&&
        mechanical.parts===19&&mechanical.headDelta>mechanical.torsoDelta&&mechanical.reload>0&&mechanical.crouch>0&&mechanical.landing>0&&mechanical.landing<1&&mechanical.weaponLowered&&mechanical.shoulderSplit&&
        result.staleScripts.length===0;
      return result;
    }finally{
      if(probe)probe.destroy();
    }
  })()`);
  if(state.build!==expectedBuild)throw new Error('Pack46 HTTP stale build after reload: expected '+expectedBuild+', got '+state.build);
  if(!state.ok)throw new Error('Pack46 HTTP runtime contract failed: '+JSON.stringify(state));
  if(session.hasFatalDiagnostics())throw new Error('Pack46 HTTP fatal browser diagnostics: '+JSON.stringify(session.fatalDiagnosticsTail()));
  console.log('Pack46 HTTP browser smoke passed:',JSON.stringify({...state,diagnostics:session.diagnosticsTail()}));
}finally{
  session.close();
}
