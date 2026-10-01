import { setTimeout as sleep } from 'node:timers/promises';
import { classifyBrowserDiagnostic, formatBrowserDiagnostic } from './browser-diagnostic-policy.mjs';

const DEFAULT_ENDPOINT='http://127.0.0.1:9222/json/list';

function errorText(error){
  return error instanceof Error?error.message:String(error);
}

export async function openBrowserCdpSession({
  endpoint=DEFAULT_ENDPOINT,
  waitMs=15000,
  pageMatches=()=>false,
  pageUnavailableMessage=({waitMs:boundedWaitMs,endpoint:targetEndpoint,lastError})=>
    `CDP page was not available within ${boundedWaitMs}ms; endpoint=${targetEndpoint}; last=${lastError}`,
  websocketTimeoutMessage='CDP websocket timeout',
  websocketErrorMessage='CDP websocket failed',
  websocketTimeoutMs=4000,
  fetchImpl=globalThis.fetch,
  WebSocketImpl=globalThis.WebSocket,
  sleepImpl=sleep,
  now=Date.now
}={}){
  const boundedWaitMs=Math.max(1,Number(waitMs)||15000);
  const deadline=now()+boundedWaitMs;
  let page=null,lastCdpError='CDP endpoint not queried yet';

  while(now()<deadline){
    try{
      const response=await fetchImpl(endpoint);
      if(!response.ok)throw new Error('HTTP '+response.status);
      const pages=await response.json();
      if(!Array.isArray(pages))throw new Error('CDP endpoint did not return a page list');
      page=pages.find(candidate=>candidate?.type==='page'&&pageMatches(candidate))||pages.find(candidate=>candidate?.type==='page');
      if(page?.webSocketDebuggerUrl)break;
      lastCdpError='CDP responded without a debuggable page';
    }catch(error){
      lastCdpError=errorText(error);
    }
    await sleepImpl(100);
  }

  if(!page?.webSocketDebuggerUrl){
    throw new Error(pageUnavailableMessage({waitMs:boundedWaitMs,endpoint,lastError:lastCdpError}));
  }

  const ws=new WebSocketImpl(page.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{
    let timer=null,settled=false;
    const cleanup=()=>{
      if(timer!==null)clearTimeout(timer);
      ws.removeEventListener('open',onOpen);
      ws.removeEventListener('error',onError);
    };
    const fail=error=>{
      if(settled)return;
      settled=true;cleanup();
      try{ws.close();}catch{}
      reject(error);
    };
    const onOpen=()=>{
      if(settled)return;
      settled=true;cleanup();resolve();
    };
    const onError=()=>fail(new Error(websocketErrorMessage));
    timer=setTimeout(()=>fail(new Error(websocketTimeoutMessage)),websocketTimeoutMs);
    ws.addEventListener('open',onOpen);
    ws.addEventListener('error',onError);
  });

  let nextId=1,closed=false;
  const pending=new Map(),events=[],fatalEvents=[];
  const rejectPending=message=>{
    for(const {reject} of pending.values())reject(new Error(message));
    pending.clear();
  };

  ws.addEventListener('message',event=>{
    const msg=JSON.parse(event.data);
    const diagnostic=classifyBrowserDiagnostic(msg);
    if(diagnostic){
      const rendered=formatBrowserDiagnostic(diagnostic);
      events.push(rendered);
      if(diagnostic.fatal)fatalEvents.push(rendered);
    }
    if(!msg.id)return;
    const request=pending.get(msg.id);if(!request)return;
    pending.delete(msg.id);
    if(msg.error)request.reject(new Error(JSON.stringify(msg.error)));else request.resolve(msg.result);
  });
  ws.addEventListener('close',()=>{
    if(closed)return;
    closed=true;
    rejectPending('CDP websocket closed');
  });
  ws.addEventListener('error',()=>{
    if(closed)return;
    closed=true;
    rejectPending('CDP websocket failed');
  });

  function send(method,params={}){
    if(closed)return Promise.reject(new Error('CDP websocket is closed'));
    const id=nextId++;
    return new Promise((resolve,reject)=>{
      pending.set(id,{resolve,reject});
      try{ws.send(JSON.stringify({id,method,params}));}
      catch(error){pending.delete(id);reject(error);}
    });
  }
  function close(){
    if(closed)return;
    closed=true;
    rejectPending('CDP session closed');
    ws.close();
  }
  const diagnosticsTail=(limit=30)=>events.slice(-Math.max(0,limit));
  const fatalDiagnosticsTail=(limit=10)=>fatalEvents.slice(-Math.max(0,limit));
  const hasFatalDiagnostics=()=>fatalEvents.length>0;

  try{
    await send('Runtime.enable');
    await send('Log.enable');
  }catch(error){
    close();
    throw error;
  }

  return Object.freeze({send,close,diagnosticsTail,fatalDiagnosticsTail,hasFatalDiagnostics});
}
