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
  const r=await send('Runtime.evaluate',{expression:"document.documentElement.dataset.zapBoot||''",returnByValue:true});
  if(r.result?.value==='ready'){ready=true;break;}
  await sleep(120);
}
if(!ready)throw new Error('file:// boot did not reach ready state');

const evalResult=await send('Runtime.evaluate',{
  expression:`(async()=>{
    const btn=document.getElementById('menuSettingsBtn');
    if(!btn)return {ok:false,reason:'missing-settings-button'};
    const r=btn.getBoundingClientRect();
    const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
    const started=performance.now();
    btn.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'mouse',isPrimary:true}));
    btn.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerType:'mouse',isPrimary:true}));
    btn.click();
    await new Promise(resolve=>setTimeout(resolve,180));
    const modal=document.getElementById('settings-modal');
    const audioFlag=typeof GAME_AUDIO_FILE_ASSETS_ENABLED!=='undefined'?GAME_AUDIO_FILE_ASSETS_ENABLED:null;
    const pendingLoads=typeof gameAudioLoads!=='undefined'?gameAudioLoads.size:null;
    const result={
      ok:true,
      hitId:hit?.id||'',
      settingsOpen:!!modal?.classList.contains('on'),
      fileAudioEnabled:audioFlag,
      pendingLoads,
      delay:performance.now()-started
    };
    document.getElementById('settingsCloseBtn')?.click();
    await new Promise(resolve=>setTimeout(resolve,40));
    result.settingsClosed=!modal?.classList.contains('on');
    return result;
  })()`,
  awaitPromise:true,
  returnByValue:true
});
const result=evalResult.result?.value;
ws.close();

if(!result?.ok)throw new Error('menu smoke failed: '+JSON.stringify(result));
if(result.hitId!=='menuSettingsBtn')throw new Error('settings button is not the hit-test target: '+JSON.stringify(result));
if(!result.settingsOpen||!result.settingsClosed)throw new Error('settings button/modal click path failed: '+JSON.stringify(result));
if(result.fileAudioEnabled!==false)throw new Error('file:// WAV loading is still enabled: '+JSON.stringify(result));
if(result.pendingLoads!==0)throw new Error('file:// audio loads were started: '+JSON.stringify(result));
if(result.delay>1200)throw new Error('menu click event loop latency is too high: '+JSON.stringify(result));
console.log('Local file menu smoke passed:',JSON.stringify(result));
