import { setTimeout as sleep } from 'node:timers/promises';

const endpoint=process.env.ZAP_CDP_ENDPOINT||'http://127.0.0.1:9223/json/list';
let page=null;
for(let i=0;i<60;i++){
  try{
    const pages=await fetch(endpoint).then(r=>r.json());
    page=pages.find(p=>p.type==='page'&&p.url.startsWith('http://127.0.0.1:8000'))||pages.find(p=>p.type==='page');
    if(page?.webSocketDebuggerUrl)break;
  }catch{}
  await sleep(100);
}
if(!page?.webSocketDebuggerUrl)throw new Error('HTTP smoke: CDP page was not available');

const ws=new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error('HTTP smoke: CDP websocket timeout')),4000);
  ws.addEventListener('open',()=>{clearTimeout(timer);resolve();},{once:true});
  ws.addEventListener('error',()=>{clearTimeout(timer);reject(new Error('HTTP smoke: CDP websocket failed'));},{once:true});
});
let nextId=1;
const pending=new Map(),events=[];
ws.addEventListener('message',event=>{
  const msg=JSON.parse(event.data);
  if(msg.method==='Runtime.exceptionThrown'){
    const d=msg.params?.exceptionDetails;
    events.push('exception '+JSON.stringify({text:d?.text,line:d?.lineNumber,column:d?.columnNumber,url:d?.url,exception:d?.exception?.description}));
  }else if(msg.method==='Runtime.consoleAPICalled'&&['error','warning'].includes(msg.params?.type)){
    events.push('console.'+msg.params.type+' '+(msg.params.args||[]).map(x=>x.value??x.description??x.type).join(' '));
  }else if(msg.method==='Log.entryAdded'&&['error','warning'].includes(msg.params?.entry?.level)){
    events.push('log.'+msg.params.entry.level+' '+msg.params.entry.text);
  }
  if(!msg.id)return;
  const p=pending.get(msg.id);if(!p)return;
  pending.delete(msg.id);
  if(msg.error)p.reject(new Error(JSON.stringify(msg.error)));else p.resolve(msg.result);
});
function send(method,params={}){
  const id=nextId++;
  return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
}
await send('Runtime.enable');
await send('Log.enable');

async function evaluate(expression){
  const result=await send('Runtime.evaluate',{expression,returnByValue:true});
  if(result.exceptionDetails)throw new Error('HTTP smoke evaluate failed: '+JSON.stringify(result.exceptionDetails));
  return result.result?.value;
}
const stateExpr="(()=>({boot:document.documentElement.dataset.zapBoot||'',loadingHidden:!!document.getElementById('loading')?.classList.contains('hidden'),readyState:document.readyState,scripts:[...document.scripts].map(s=>s.src||s.id||'inline').slice(-20),globals:{perception:typeof updateBotTargetPerception,bots:typeof Enemy,runtime:typeof loop,noise:typeof BOT_NOISE_EVENTS,preload:typeof preloadGameContent}}))()";

const deadline=Date.now()+18000;
let state=null;
while(Date.now()<deadline){
  state=await evaluate(stateExpr);
  if(state?.boot==='ready'){ws.close();console.log('HTTP browser boot smoke passed:',JSON.stringify(state));process.exit(0);}
  if(state?.boot==='failed')break;
  await sleep(150);
}
const tail=events.slice(-30);
ws.close();
throw new Error('HTTP boot did not become ready; state='+JSON.stringify(state)+'; events='+JSON.stringify(tail));
