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

const pickupLayout=await evaluate(`(()=>{
  const toast=document.getElementById('pickup-toast');
  const title=document.getElementById('pickup-toast-title');
  const detail=document.getElementById('pickup-toast-detail');
  if(!toast||!title||!detail)return {ok:false,reason:'missing-pickup-toast-layout-node'};
  const oldTitle=title.textContent,oldDetail=detail.textContent;
  title.textContent='БОЕПРИПАСЫ';
  detail.textContent='СНАЙПЕРСКАЯ ВИНТОВКА · +200 · запас 320';
  const tr=toast.getBoundingClientRect(),yr=title.getBoundingClientRect(),dr=detail.getBoundingClientRect();
  const result={
    ok:true,
    titleCenter:(yr.top+yr.height*.5-tr.top)/tr.height,
    detailCenter:(dr.top+dr.height*.5-tr.top)/tr.height,
    separated:yr.bottom<=dr.top,
    titleInside:yr.left>=tr.left&&yr.right<=tr.right&&yr.top>=tr.top&&yr.bottom<=tr.bottom,
    detailInside:dr.left>=tr.left&&dr.right<=tr.right&&dr.top>=tr.top&&dr.bottom<=tr.bottom,
    detailScrollWidth:detail.scrollWidth,
    detailClientWidth:detail.clientWidth,
    detailWhiteSpace:getComputedStyle(detail).whiteSpace
  };
  title.textContent=oldTitle;detail.textContent=oldDetail;
  return result;
})()`);
if(!pickupLayout?.ok)throw new Error('pickup notification layout smoke failed: '+JSON.stringify(pickupLayout));
if(pickupLayout.titleCenter<.32||pickupLayout.titleCenter>.49||pickupLayout.detailCenter<.64||pickupLayout.detailCenter>.82||!pickupLayout.separated||!pickupLayout.titleInside||!pickupLayout.detailInside||pickupLayout.detailWhiteSpace!=='nowrap'||pickupLayout.detailScrollWidth>pickupLayout.detailClientWidth+1){
  throw new Error('pickup notification text is not aligned inside its two frame slots: '+JSON.stringify(pickupLayout));
}


const perkCardLayout=await evaluate(`(()=>{
  const host=document.createElement('div');
  host.style.cssText='position:fixed;left:-9999px;top:0;width:204px;z-index:-1;';
  const card=document.createElement('div');
  card.className='pcard rarity-common';
  card.innerHTML='<img class="pcard-ic" alt=""><div class="pcard-rarity">ОБЫЧНОЕ</div><div class="pcard-nm"><span class="perk-emoji">🌀</span> Рефлекторные сервоприводы</div><div class="pcard-ds">+10% скорость движения и +10% скорость перезарядки.</div><div class="pcard-meta"><span class="pcard-path">Мобильность</span> · <span class="pcard-rank">ранг 1/3</span> · клавиша 5</div>';
  host.appendChild(card);document.body.appendChild(host);
  if(typeof applyPresentationAtlasVariables==='function'&&typeof perkRarityPresentationFrame==='function'){
    applyPresentationAtlasVariables(card,'perk-frame',perkRarityPresentationFrame('common'));
  }
  const cr=card.getBoundingClientRect();
  const nodes=[...card.children].map(el=>({cls:el.className,r:el.getBoundingClientRect(),scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight}));
  const inside=nodes.every(x=>x.r.left>=cr.left+8&&x.r.right<=cr.right-8&&x.r.top>=cr.top+8&&x.r.bottom<=cr.bottom-12);
  const noOverflow=nodes.every(x=>x.scrollWidth<=x.clientWidth+1&&x.scrollHeight<=x.clientHeight+1);
  const ds=card.querySelector('.pcard-ds').getBoundingClientRect(),meta=card.querySelector('.pcard-meta').getBoundingClientRect();
  const result={height:cr.height,width:cr.width,inside,noOverflow,separated:ds.bottom<=meta.top+1,bottomInset:cr.bottom-meta.bottom,nodes:nodes.map(x=>({cls:x.cls,left:x.r.left-cr.left,right:cr.right-x.r.right,top:x.r.top-cr.top,bottom:cr.bottom-x.r.bottom}))};
  host.remove();return result;
})()`);
if(perkCardLayout.height<218||!perkCardLayout.inside||!perkCardLayout.noOverflow||!perkCardLayout.separated||perkCardLayout.bottomInset<12){
  throw new Error('perk choice text escapes decorative frame safe area: '+JSON.stringify(perkCardLayout));
}

if(session.hasFatalDiagnostics()){
  const tail=session.diagnosticsTail(),fatalTail=session.fatalDiagnosticsTail();
  session.close();
  throw new Error('file:// smoke observed fatal browser diagnostics; fatal='+JSON.stringify(fatalTail)+'; events='+JSON.stringify(tail));
}
const diagnostics=session.diagnosticsTail();
session.close();
console.log('Local file menu + generated asset parity smoke passed:',JSON.stringify({...prep,...opened,settingsClosed,localGeneratedAssetsReady,pickupLayout,perkCardLayout,diagnostics}));
