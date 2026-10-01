import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { openBrowserCdpSession } from './browser-cdp-session.mjs';

class FakeWebSocket{
  static instances=[];
  constructor(url){
    this.url=url;this.listeners=new Map();this.sent=[];this.closeCount=0;
    FakeWebSocket.instances.push(this);
    queueMicrotask(()=>this.emit('open',{}));
  }
  addEventListener(type,listener,options={}){
    const bucket=this.listeners.get(type)||[];
    bucket.push({listener,once:!!options.once});
    this.listeners.set(type,bucket);
  }
  removeEventListener(type,listener){
    const current=this.listeners.get(type)||[];
    this.listeners.set(type,current.filter(entry=>entry.listener!==listener));
  }
  emit(type,event){
    const bucket=[...(this.listeners.get(type)||[])];
    for(const entry of bucket){
      entry.listener(event);
      if(entry.once){
        const current=this.listeners.get(type)||[];
        this.listeners.set(type,current.filter(candidate=>candidate!==entry));
      }
    }
  }
  send(payload){
    const request=JSON.parse(payload);this.sent.push(request);
    if(request.method==='Never.respond')return;
    queueMicrotask(()=>this.emit('message',{data:JSON.stringify({id:request.id,result:{method:request.method,params:request.params}})}));
  }
  close(){this.closeCount++;queueMicrotask(()=>this.emit('close',{}));}
}

function createTimerHarness(){
  let nextTimerId=1;
  const active=new Map(),cleared=[];
  return {
    setTimeoutImpl(callback,ms){
      const id=nextTimerId++;
      active.set(id,{callback,ms});
      return id;
    },
    clearTimeoutImpl(id){
      if(active.delete(id))cleared.push(id);
    },
    fireOnly(){
      assert.equal(active.size,1,'expected exactly one active timer');
      const [[id,{callback}]]=[...active.entries()];
      active.delete(id);
      callback();
    },
    activeCount(){return active.size;},
    clearedCount(){return cleared.length;}
  };
}

const pages=[
  {type:'page',url:'http://127.0.0.1:8000/',webSocketDebuggerUrl:'ws://fallback'},
  {type:'page',url:'file:///tmp/index.html',webSocketDebuggerUrl:'ws://preferred'}
];

async function openFakeSession(options={}){
  FakeWebSocket.instances.length=0;
  return openBrowserCdpSession({
    waitMs:1000,
    pageMatches:page=>page.url.startsWith('file://'),
    fetchImpl:async()=>({ok:true,json:async()=>pages}),
    WebSocketImpl:FakeWebSocket,
    ...options
  });
}

test('shared session owns target selection, CDP multiplexing, diagnostics and close lifecycle',async()=>{
  const timers=createTimerHarness();
  const session=await openFakeSession(timers);
  const ws=FakeWebSocket.instances[0];
  assert.equal(ws.url,'ws://preferred');
  assert.deepEqual(ws.sent.slice(0,2).map(request=>request.method),['Runtime.enable','Log.enable']);
  assert.equal(timers.activeCount(),0,'connect/domain-enable timers must be cleared');

  const evaluated=await session.send('Runtime.evaluate',{expression:'2+2'});
  assert.equal(evaluated.method,'Runtime.evaluate');
  assert.equal(evaluated.params.expression,'2+2');
  assert.equal(timers.activeCount(),0,'successful response must clear its command timer');

  ws.emit('message',{data:JSON.stringify({method:'Runtime.consoleAPICalled',params:{type:'warning',args:[{value:'heads up'}]}})});
  ws.emit('message',{data:JSON.stringify({method:'Log.entryAdded',params:{entry:{level:'error',source:'network',text:'missing asset'}}})});
  assert.equal(session.hasFatalDiagnostics(),true);
  assert.match(session.diagnosticsTail(2)[0],/console\.warning/);
  assert.match(session.fatalDiagnosticsTail(1)[0],/missing asset/);

  const pending=session.send('Never.respond');
  assert.equal(timers.activeCount(),1);
  session.close();
  await assert.rejects(pending,/CDP session closed/);
  assert.equal(timers.activeCount(),0,'close must clear pending command timers');
  session.close();
  assert.equal(ws.closeCount,1);
  await assert.rejects(session.send('Runtime.evaluate'),/CDP websocket is closed/);
});

test('hung command fails on its own bounded timer with method/request context only',async()=>{
  const timers=createTimerHarness();
  const session=await openFakeSession({...timers,commandTimeoutMs:25});
  const pending=session.send('Never.respond',{expression:'SECRET_SENTINEL'});
  assert.equal(timers.activeCount(),1);
  timers.fireOnly();
  await assert.rejects(pending,error=>{
    assert.match(error.message,/CDP command timed out after 25ms/);
    assert.match(error.message,/method=Never\.respond/);
    assert.match(error.message,/requestId=3/);
    assert.doesNotMatch(error.message,/SECRET_SENTINEL/);
    return true;
  });
  assert.equal(timers.activeCount(),0);
  session.close();
});

test('socket failure clears pending command timers exactly once',async()=>{
  const timers=createTimerHarness();
  const session=await openFakeSession(timers);
  const ws=FakeWebSocket.instances[0];
  const pending=session.send('Never.respond');
  assert.equal(timers.activeCount(),1);
  const clearsBefore=timers.clearedCount();
  ws.emit('error',{});
  await assert.rejects(pending,/CDP websocket failed/);
  assert.equal(timers.activeCount(),0);
  assert.equal(timers.clearedCount(),clearsBefore+1,'socket failure clears the pending command timer once');
  ws.emit('close',{});
  assert.equal(timers.clearedCount(),clearsBefore+1,'follow-up close cannot clear it again');
});


test('page discovery failure keeps caller-specific error wording and last endpoint error',async()=>{
  let nowValue=0;
  await assert.rejects(
    openBrowserCdpSession({
      endpoint:'http://cdp.invalid/json/list',
      waitMs:250,
      fetchImpl:async()=>{throw new Error('connection refused');},
      WebSocketImpl:FakeWebSocket,
      now:()=>nowValue,
      sleepImpl:async ms=>{nowValue+=ms;},
      pageUnavailableMessage:({waitMs,endpoint,lastError})=>`custom ${waitMs} ${endpoint} ${lastError}`
    }),
    /custom 250 http:\/\/cdp\.invalid\/json\/list connection refused/
  );
});


test('browser smoke consumers delegate transport and diagnostic collection to the shared session owner',()=>{
  for(const name of ['browser-boot-smoke.mjs','browser-menu-smoke.mjs']){
    const source=readFileSync(new URL('./'+name,import.meta.url),'utf8');
    assert.match(source,/import \{ openBrowserCdpSession \} from '\.\/browser-cdp-session\.mjs';/,name+' shared session import');
    assert.doesNotMatch(source,/new WebSocket\s*\(/,name+' must not own WebSocket transport');
    assert.doesNotMatch(source,/classifyBrowserDiagnostic|formatBrowserDiagnostic/,name+' must not own diagnostic policy plumbing');
  }
});
