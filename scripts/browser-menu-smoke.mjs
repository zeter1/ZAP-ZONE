import { setTimeout as sleep } from 'node:timers/promises';
import { openBrowserCdpSession } from './browser-cdp-session.mjs';

const endpoint=process.env.ZAP_CDP_ENDPOINT||'http://127.0.0.1:9222/json/list';
const cdpWaitMs=Math.max(1000,Number(process.env.ZAP_CDP_WAIT_MS)||15000);
const session=await openBrowserCdpSession({
  endpoint,
  waitMs:cdpWaitMs,
  pageMatches:page=>page.url.startsWith('file://'),
  pageUnavailableMessage:({waitMs,endpoint,lastError})=>
    'file:// smoke: CDP page was not available within '+waitMs+'ms; endpoint='+endpoint+'; last='+lastError,
  websocketTimeoutMessage:'CDP websocket timeout',
  websocketErrorMessage:'CDP websocket failed'
});
const {send}=session;

const deadline=Date.now()+12000;
let ready=false;
while(Date.now()<deadline){
  const r=await send('Runtime.evaluate',{
    expression:"({boot:document.documentElement.dataset.zapBoot||'',loadingHidden:!!document.getElementById('loading')?.classList.contains('hidden')})",
    returnByValue:true
  });
  const state=r.result?.value;
  if(state?.boot==='ready'&&state.loadingHidden){ready=true;break;}
  await sleep(120);
}
if(!ready)throw new Error('file:// boot/menu did not become interactive');

async function evaluate(expression,awaitPromise=false){
  const result=await send('Runtime.evaluate',{expression,awaitPromise,returnByValue:true});
  if(result.exceptionDetails)throw new Error('Runtime.evaluate failed: '+JSON.stringify(result.exceptionDetails));
  return result.result?.value;
}
async function mouseClick(x,y){
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});
  await send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',buttons:1,clickCount:1});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',buttons:0,clickCount:1});
}

const localGeneratedAssetsReady=await evaluate(`(async()=>{
  const root=document.documentElement;
  const logo=document.getElementById('brand-logo');
  const generatedImgs=[...document.querySelectorAll('img[data-generated-src]')];
  const waitImage=src=>new Promise(resolve=>{
    const probe=new Image();
    const done=ok=>resolve({ok,src:probe.src,naturalWidth:probe.naturalWidth,naturalHeight:probe.naturalHeight});
    probe.onload=()=>done(probe.naturalWidth>0&&probe.naturalHeight>0);
    probe.onerror=()=>done(false);
    probe.src=src;
  });
  const menuBg=await waitImage(new URL('assets/ui/backgrounds/menu-bg-arena-01.jpg',location.href).href);
  const loadingBg=await waitImage(new URL('assets/ui/backgrounds/loading-bg-arena-01.jpg',location.href).href);
  const generatedStates=generatedImgs.map(img=>({
    id:img.id||'',
    src:img.getAttribute('src')||'',
    generated:img.dataset.generatedSrc||'',
    complete:img.complete,
    naturalWidth:img.naturalWidth
  }));
  return {
    enabled:root.classList.contains('generated-art-enabled'),
    logoSrc:logo?.getAttribute('src')||'',
    logoReady:!!(logo?.complete&&logo.naturalWidth>0),
    menuBackground:getComputedStyle(document.getElementById('menu')).backgroundImage,
    loadingBackground:getComputedStyle(document.getElementById('loading')).backgroundImage,
    menuBg,loadingBg,generatedStates
  };
})()`,true);
if(!localGeneratedAssetsReady?.enabled)throw new Error('file:// generated presentation art is not enabled: '+JSON.stringify(localGeneratedAssetsReady));
if(!localGeneratedAssetsReady.logoSrc.includes('zap-zone-logo-01.png')||!localGeneratedAssetsReady.logoReady)throw new Error('file:// generated logo did not load: '+JSON.stringify(localGeneratedAssetsReady));
if(!localGeneratedAssetsReady.menuBackground.includes('menu-bg-arena-01.jpg')||!localGeneratedAssetsReady.menuBg?.ok)throw new Error('file:// menu background did not load: '+JSON.stringify(localGeneratedAssetsReady));
if(!localGeneratedAssetsReady.loadingBackground.includes('loading-bg-arena-01.jpg')||!localGeneratedAssetsReady.loadingBg?.ok)throw new Error('file:// loading background did not load: '+JSON.stringify(localGeneratedAssetsReady));
const brokenGenerated=localGeneratedAssetsReady.generatedStates.filter(x=>x.generated&&(!x.src.includes(x.generated)||!x.complete||x.naturalWidth<=0));
if(brokenGenerated.length)throw new Error('file:// generated DOM assets did not load: '+JSON.stringify(brokenGenerated));

const prep=await evaluate(`(()=>{
  const settings=document.getElementById('menuSettingsBtn');
  const start=document.getElementById('startBtn');
  if(!settings||!start)return {ok:false,reason:'missing-menu-buttons'};
  const sr=settings.getBoundingClientRect(),pr=start.getBoundingClientRect();
  const describe=el=>{
    const path=[];
    for(let n=el;n&&path.length<6;n=n.parentElement){
      const cs=getComputedStyle(n);
      path.push({tag:n.tagName,id:n.id||'',cls:typeof n.className==='string'?n.className:'',pe:cs.pointerEvents,z:cs.zIndex,display:cs.display,visibility:cs.visibility});
    }
    return path;
  };
  const settingsHit=document.elementFromPoint(sr.left+sr.width/2,sr.top+sr.height/2);
  const startHit=document.elementFromPoint(pr.left+pr.width/2,pr.top+pr.height/2);
  window.__zapMenuSmokeStarted=performance.now();
  return {
    ok:true,
    settingsX:sr.left+sr.width/2,
    settingsY:sr.top+sr.height/2,
    settingsHitPath:describe(settingsHit),
    startHitPath:describe(startHit)
  };
})()`);
if(!prep?.ok)throw new Error('menu geometry smoke failed: '+JSON.stringify(prep));

await mouseClick(prep.settingsX,prep.settingsY);

const menuReadyDeadline=Date.now()+5000;
let opened=null,menuReadyInBudget=false;
while(Date.now()<menuReadyDeadline){
  opened=await evaluate(`(()=>{
    const modal=document.getElementById('settings-modal');
    const close=document.getElementById('settingsCloseBtn');
    const r=close?.getBoundingClientRect();
    return {
      settingsOpen:!!modal?.classList.contains('on'),
      fileAudioEnabled:typeof GAME_AUDIO_FILE_ASSETS_ENABLED!=='undefined'?GAME_AUDIO_FILE_ASSETS_ENABLED:null,
      pendingLoads:typeof gameAudioLoads!=='undefined'?gameAudioLoads.size:null,
      delay:performance.now()-(window.__zapMenuSmokeStarted||performance.now()),
      closeX:r?r.left+r.width/2:null,
      closeY:r?r.top+r.height/2:null,
      closeHit:r?!!document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)?.closest?.('#settingsCloseBtn'):false
    };
  })()`);
  if(opened?.settingsOpen&&opened.closeHit){
    menuReadyInBudget=Date.now()<=menuReadyDeadline;
    break;
  }
  await sleep(80);
}
if(!menuReadyInBudget)throw new Error('settings did not become interactive within 5000ms; blockers='+JSON.stringify({prep,opened}));
if(opened.fileAudioEnabled!==false)throw new Error('file:// WAV loading is still enabled: '+JSON.stringify(opened));
if(opened.pendingLoads!==0)throw new Error('file:// audio loads were started: '+JSON.stringify(opened));

await mouseClick(opened.closeX,opened.closeY);
await sleep(80);
const settingsClosed=await evaluate("!document.getElementById('settings-modal')?.classList.contains('on')");
if(!settingsClosed){
  session.close();
  throw new Error('real CDP click did not close settings');
}
if(session.hasFatalDiagnostics()){
  const tail=session.diagnosticsTail(),fatalTail=session.fatalDiagnosticsTail();
  session.close();
  throw new Error('file:// smoke observed fatal browser diagnostics; fatal='+JSON.stringify(fatalTail)+'; events='+JSON.stringify(tail));
}
const diagnostics=session.diagnosticsTail();
session.close();
console.log('Local file menu + generated asset parity smoke passed:',JSON.stringify({...prep,...opened,settingsClosed,localGeneratedAssetsReady,diagnostics}));
