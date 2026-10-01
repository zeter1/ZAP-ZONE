import { setTimeout as sleep } from 'node:timers/promises';
import { openBrowserCdpSession } from './browser-cdp-session.mjs';

const endpoint=process.env.ZAP_CDP_ENDPOINT||'http://127.0.0.1:9222/json/list';
const cdpWaitMs=Math.max(1000,Number(process.env.ZAP_CDP_WAIT_MS)||15000);
const session=await openBrowserCdpSession({
  endpoint,
  waitMs:cdpWaitMs,
  pageMatches:page=>page.url.startsWith('http://127.0.0.1:8000'),
  pageUnavailableMessage:({waitMs,endpoint,lastError})=>
    'HTTP smoke: CDP page was not available within '+waitMs+'ms; endpoint='+endpoint+'; last='+lastError,
  websocketTimeoutMessage:'HTTP smoke: CDP websocket timeout',
  websocketErrorMessage:'HTTP smoke: CDP websocket failed'
});
const {send}=session;

async function evaluate(expression){
  const result=await send('Runtime.evaluate',{expression,returnByValue:true});
  if(result.exceptionDetails)throw new Error('HTTP smoke evaluate failed: '+JSON.stringify(result.exceptionDetails));
  return result.result?.value;
}
const stateExpr="(()=>({boot:document.documentElement.dataset.zapBoot||'',loadingHidden:!!document.getElementById('loading')?.classList.contains('hidden'),readyState:document.readyState,scripts:[...document.scripts].map(s=>s.src||s.id||'inline').slice(-20),globals:{perception:typeof updateBotTargetPerception,bots:typeof Enemy,runtime:typeof loop,noise:typeof BOT_NOISE_EVENTS,preload:typeof preloadGameContent}}))()";
const geometryExpr=`(()=>{
  const from=new THREE.Vector3(0,0,0),to=new THREE.Vector3(10,0,0);
  const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
  const makeWall=(x,width)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(width,2,2),material);
    mesh.position.set(x,0,0);mesh.updateMatrixWorld(true);return mesh;
  };
  const nearWall=makeWall(3,.2),farWall=makeWall(6,.2),endpointWall=makeWall(9.95,.1);
  try{
    const noHit=firstWallHitDistance(from,to,[]);
    const nearest=firstWallHitDistance(from,to,[farWall,nearWall]);
    const endpointDistance=firstWallHitDistance(from,to,[endpointWall]);
    const result={
      noHitClear:!Number.isFinite(noHit),
      nearest,
      nearestOk:Number.isFinite(nearest)&&Math.abs(nearest-2.9)<1e-4,
      endpointClear:!Number.isFinite(endpointDistance),
      wallBetweenHit:wallBetween(from,to,[farWall,nearWall]),
      wallBetweenClear:!wallBetween(from,to,[]),
      wallBetweenEndpointClear:!wallBetween(from,to,[endpointWall])
    };
    result.ok=result.noHitClear&&result.nearestOk&&result.endpointClear&&result.wallBetweenHit&&result.wallBetweenClear&&result.wallBetweenEndpointClear;
    return result;
  }finally{
    nearWall.geometry.dispose();farWall.geometry.dispose();endpointWall.geometry.dispose();material.dispose();
  }
})()`;

const deadline=Date.now()+18000;
let state=null;
while(Date.now()<deadline){
  state=await evaluate(stateExpr);
  if(state?.boot==='ready'){
    const geometry=await evaluate(geometryExpr);
    if(!geometry?.ok){
      const tail=session.diagnosticsTail();session.close();
      throw new Error('HTTP smoke wall geometry contract failed; geometry='+JSON.stringify(geometry)+'; events='+JSON.stringify(tail));
    }
    if(session.hasFatalDiagnostics()){
      const tail=session.diagnosticsTail(),fatalTail=session.fatalDiagnosticsTail();session.close();
      throw new Error('HTTP smoke observed fatal browser diagnostics after ready; state='+JSON.stringify(state)+'; fatal='+JSON.stringify(fatalTail)+'; events='+JSON.stringify(tail));
    }
    const tail=session.diagnosticsTail();
    session.close();console.log('HTTP browser boot smoke passed:',JSON.stringify({...state,wallGeometry:geometry,diagnostics:tail}));process.exit(0);
  }
  if(state?.boot==='failed')break;
  await sleep(150);
}
const tail=session.diagnosticsTail();
session.close();
throw new Error('HTTP boot did not become ready; state='+JSON.stringify(state)+'; events='+JSON.stringify(tail));
