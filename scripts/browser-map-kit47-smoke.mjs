import { readFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { openBrowserCdpSession } from './browser-cdp-session.mjs';

const expectedBuild=JSON.parse(readFileSync(new URL('../version.json',import.meta.url),'utf8')).build;
const mode=process.env.ZAP_MAP47_MODE==='file'?'file':'http';
const endpoint=process.env.ZAP_CDP_ENDPOINT||'http://127.0.0.1:9222/json/list';
const prefix=mode==='file'?'file://':'http://127.0.0.1:8000';
const session=await openBrowserCdpSession({
  endpoint,
  waitMs:Math.max(1000,Number(process.env.ZAP_CDP_WAIT_MS)||15000),
  pageMatches:page=>page.url.startsWith(prefix),
  pageUnavailableMessage:({waitMs,endpoint,lastError})=>
    'Pack47 '+mode+' smoke: page unavailable after '+waitMs+'ms; endpoint='+endpoint+'; last='+lastError,
  websocketTimeoutMessage:'Pack47 '+mode+' smoke: CDP websocket timeout',
  websocketErrorMessage:'Pack47 '+mode+' smoke: CDP websocket failed'
});
const {send}=session;
async function evaluate(expression){
  const r=await send('Runtime.evaluate',{expression,returnByValue:true});
  if(r.exceptionDetails)throw new Error('Pack47 '+mode+' evaluate failed: '+JSON.stringify(r.exceptionDetails));
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
    if(boot==='failed')throw new Error('Pack47 '+mode+' boot failed');
    await sleep(120);
  }
  if(boot!=='ready')throw new Error('Pack47 '+mode+' boot timeout after reload');
  await sleep(900);

  const state=await evaluate(`(()=>{
    if(typeof mapKit47Available!=='function'||typeof scene==='undefined'||typeof wallMeshes==='undefined'||typeof wallAABBs==='undefined'){
      return {ok:false,reason:'missing-pack47-runtime-globals'};
    }
    const required=['KIT_Wall_4m','KIT_Wall_8m','KIT_Wall_12m','KIT_Corner_90','KIT_Column','KIT_Door_Frame','KIT_Barrier','KIT_Container','KIT_Armor_Cover','KIT_SciFi_Sandbag','KIT_AntiTank_Block','KIT_Cargo_Crate','KIT_Reactor_Housing','KIT_Ramp','KIT_Ladder','KIT_Grate','KIT_Tech_Panel','KIT_Vent','KIT_Pipe_Straight','KIT_Pipe_Elbow','KIT_Cable_Tray','KIT_Fortification','KIT_Base_Module'];
    const names=[],pieces=[];
    scene.traverse(o=>{
      if(o?.userData?.presentationOnly){
        pieces.push(o);
        names.push(o.name||'');
      }
    });
    const owners=wallMeshes.filter(o=>o?.userData?.presentationCollisionOwner);
    const ownerMaterialsHidden=owners.every(o=>{
      const mats=Array.isArray(o.material)?o.material:[o.material];
      return mats.filter(Boolean).every(m=>m.colorWrite===false&&m.depthWrite===false);
    });
    const byName={};
    for(const n of names)byName[n]=(byName[n]||0)+1;
    const build=document.querySelector('meta[name="application-build"]')?.content||'';
    const localScripts=[...document.scripts].map(s=>s.src||'').filter(src=>src.includes('/src/')||src.includes('zap-map-sci-fi-kit-47.runtime.js'));
    const result={
      build,
      available:mapKit47Available(),
      version:window.ZAP_MAP_KIT_47?.version||0,
      componentCount:Object.keys(window.ZAP_MAP_KIT_47?.components||{}).length,
      missingRequired:required.filter(n=>!window.ZAP_MAP_KIT_47?.components?.[n]),
      pieces:pieces.length,
      owners:owners.length,
      wallMeshes:wallMeshes.length,
      wallAABBs:wallAABBs.length,
      ownersVisible:owners.every(o=>o.visible!==false),
      ownerMaterialsHidden,
      presentationInWallMeshes:wallMeshes.some(o=>o?.userData?.presentationOnly),
      antiShimmerPieces:pieces.filter(o=>o?.userData?.mapKit47AntiShimmer===true).length,
      presentationReceiveShadow:pieces.filter(o=>o.receiveShadow===true).length,
      presentationCastShadow:pieces.filter(o=>o.castShadow===true).length,
      shellMaterial:{roughness:mapKit47Materials().MAT_SHELL.roughness,metalness:mapKit47Materials().MAT_SHELL.metalness},
      edgeMaterial:{roughness:mapKit47Materials().MAT_EDGE.roughness,metalness:mapKit47Materials().MAT_EDGE.metalness},
      rendererAntialias:renderer.getContext?.().getContextAttributes?.().antialias??null,
      rendererPixelRatio:renderer.getPixelRatio?.()??null,
      perfMode:typeof PERF_MODE==='boolean'?PERF_MODE:null,
      cameraNear:camera.near,
      cameraFar:camera.far,
      staleScripts:localScripts.filter(src=>!src.includes('?v='+build)),
      basePieces:names.filter(n=>n.includes('KIT_Base_Module')).length,
      wallPieces:names.filter(n=>/KIT_Wall_(4|8|12)m/.test(n)).length,
      containerPieces:names.filter(n=>n.includes('KIT_Container')).length,
      armorCoverPieces:names.filter(n=>n.includes('KIT_Armor_Cover')).length,
      sandbagPieces:names.filter(n=>n.includes('KIT_SciFi_Sandbag')).length,
      antiTankPieces:names.filter(n=>n.includes('KIT_AntiTank_Block')).length,
      cargoCratePieces:names.filter(n=>n.includes('KIT_Cargo_Crate')).length,
      reactorPieces:names.filter(n=>n.includes('KIT_Reactor_Housing')).length,
      columnPieces:names.filter(n=>n.includes('KIT_Column')).length,
      doorFramePieces:names.filter(n=>n.includes('KIT_Door_Frame')).length,
      rampPieces:names.filter(n=>n.includes('KIT_Ramp')).length,
      cornerPieces:names.filter(n=>n.includes('KIT_Corner_90')).length,
      techPanelPieces:names.filter(n=>n.includes('KIT_Tech_Panel')).length,
      ventPieces:names.filter(n=>n.includes('KIT_Vent')).length,
      gratePieces:names.filter(n=>n.includes('KIT_Grate')).length,
      cableTrayPieces:names.filter(n=>n.includes('KIT_Cable_Tray')).length,
      straightPipePieces:names.filter(n=>n.includes('KIT_Pipe_Straight')).length,
      elbowPieces:names.filter(n=>n.includes('KIT_Pipe_Elbow')).length,
      doorwaySides:wallMeshes.filter(o=>o?.userData?.mapKit47DoorwaySide).length,
      doorwayPassable:[[-20,0],[20,0],[0,-20],[0,20]].every(([x,z])=>{const p=collideWalls(x,z,.35);return Math.abs(p.x-x)<1e-6&&Math.abs(p.z-z)<1e-6;}),
      doorwaySidesSolid:[[-20,8],[20,-8],[8,-20],[-8,20]].every(([x,z])=>{const p=collideWalls(x,z,.35);return Math.abs(p.x-x)>.01||Math.abs(p.z-z)>.01;}),
      names:byName
    };
    result.ok=result.available&&result.version===47&&result.componentCount===23&&result.missingRequired.length===0&&
      result.pieces>=60&&result.owners>=30&&result.wallMeshes>0&&result.wallAABBs>0&&
      result.ownersVisible&&result.ownerMaterialsHidden&&!result.presentationInWallMeshes&&
      result.antiShimmerPieces===result.pieces&&result.presentationReceiveShadow===0&&result.staleScripts.length===0&&
      Math.abs(result.cameraNear-.12)<1e-9&&result.cameraFar===220&&
      result.shellMaterial.roughness===.62&&result.shellMaterial.metalness===.24&&
      result.edgeMaterial.roughness===.52&&result.edgeMaterial.metalness===.34&&
      result.basePieces>=8&&result.wallPieces>=8&&result.columnPieces>=5&&
      result.armorCoverPieces>=4&&result.sandbagPieces>=4&&result.antiTankPieces>=24&&result.cargoCratePieces>=60&&result.reactorPieces>=8&&
      result.doorFramePieces>=4&&result.rampPieces>=4&&result.cornerPieces===0&&
      result.techPanelPieces===0&&result.ventPieces===0&&result.gratePieces===0&&result.cableTrayPieces===0&&result.straightPipePieces===0&&
      result.elbowPieces===0&&result.doorwaySides>=8&&result.doorwayPassable&&result.doorwaySidesSolid;
    return result;
  })()`);
  if(state?.build!==expectedBuild)throw new Error('Pack47 '+mode+' stale build after reload: expected '+expectedBuild+', got '+state?.build);
  if(!state?.ok)throw new Error('Pack47 '+mode+' runtime contract failed: '+JSON.stringify(state));
  if(session.hasFatalDiagnostics())throw new Error('Pack47 '+mode+' fatal browser diagnostics: '+JSON.stringify(session.fatalDiagnosticsTail()));
  console.log('Pack47 '+mode+' browser smoke passed:',JSON.stringify({...state,diagnostics:session.diagnosticsTail()}));
}finally{
  session.close();
}
