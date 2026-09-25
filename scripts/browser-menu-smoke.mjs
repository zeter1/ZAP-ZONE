import { setTimeout as sleep } from 'node:timers/promises';

const endpoint='http://127.0.0.1:9222/json/list';
let page=null;
for(let i=0;i<40;i++){
  try{
    const pages=await fetch(endpoint).then(r=>r.json());
    page=pages.find(p=>p.type==='page'&&p.url.startsWith('file://'))||pages.find(p=>p.type==='page');
    if(page?.webSocketDebuggerUrl)break;
  }catch{}
  await sleep(100);
}
if(!page?.webSocketDebuggerUrl)throw new Error('CDP page was not available');

const ws=new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error('CDP websocket timeout')),4000);
  ws.addEventListener('open',()=>{clearTimeout(timer);resolve();},{once:true});
  ws.addEventListener('error',()=>{clearTimeout(timer);reject(new Error('CDP websocket failed'));},{once:true});
});
let nextId=1;
const pending=new Map();
ws.addEventListener('message',event=>{
  const msg=JSON.parse(event.data);
  if(!msg.id)return;
  const p=pending.get(msg.id);if(!p)return;
  pending.delete(msg.id);
  if(msg.error)p.reject(new Error(JSON.stringify(msg.error)));else p.resolve(msg.result);
});
function send(method,params={}){
  const id=nextId++;
  return new Promise((resolve,reject)=>{
    pending.set(id,{resolve,reject});
    ws.send(JSON.stringify({id,method,params}));
  });
}
await send('Runtime.enable');

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
await sleep(220);

const opened=await evaluate(`(()=>{
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
if(!opened?.settingsOpen)throw new Error('real CDP click did not open settings; blockers='+JSON.stringify({prep,opened}));
if(!opened.closeHit)throw new Error('settings close button is not a hit-test target: '+JSON.stringify(opened));
if(opened.fileAudioEnabled!==false)throw new Error('file:// WAV loading is still enabled: '+JSON.stringify(opened));
if(opened.pendingLoads!==0)throw new Error('file:// audio loads were started: '+JSON.stringify(opened));
if(opened.delay>1200)throw new Error('menu click event loop latency is too high: '+JSON.stringify(opened));

await mouseClick(opened.closeX,opened.closeY);
await sleep(80);
const settingsClosed=await evaluate("!document.getElementById('settings-modal')?.classList.contains('on')");
ws.close();

if(!settingsClosed)throw new Error('real CDP click did not close settings');
console.log('Local file menu smoke passed:',JSON.stringify({...prep,...opened,settingsClosed}));
