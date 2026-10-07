import { openBrowserCdpSession } from './browser-cdp-session.mjs';

const endpoint=process.env.ZAP_CDP_ENDPOINT||'http://127.0.0.1:9222/json/list';
const cdpWaitMs=Math.max(1000,Number(process.env.ZAP_CDP_WAIT_MS)||8000);
const session=await openBrowserCdpSession({
  endpoint,
  waitMs:cdpWaitMs,
  pageMatches:page=>page.url.startsWith('http://127.0.0.1:8000'),
  pageUnavailableMessage:({waitMs,endpoint,lastError})=>
    'death UI smoke: HTTP page was not available within '+waitMs+'ms; endpoint='+endpoint+'; last='+lastError,
  websocketTimeoutMessage:'death UI smoke: CDP websocket timeout',
  websocketErrorMessage:'death UI smoke: CDP websocket failed'
});
const {send}=session;

async function evaluate(expression){
  const result=await send('Runtime.evaluate',{expression,returnByValue:true});
  if(result.exceptionDetails)throw new Error('death UI smoke evaluate failed: '+JSON.stringify(result.exceptionDetails));
  return result.result?.value;
}

const readyDeadline=Date.now()+5000;
let helpersReady=false;
while(Date.now()<readyDeadline){
  helpersReady=await evaluate("typeof showPauseUI==='function'&&typeof updateRespawnCountdownPresentation==='function'&&typeof setGameCursorHidden==='function'");
  if(helpersReady)break;
  await new Promise(resolve=>setTimeout(resolve,80));
}
if(!helpersReady){
  session.close();
  throw new Error('death UI helpers did not load');
}

const result=await evaluate(`(()=>{
  const pause=document.getElementById('pause'),countdown=document.getElementById('respawn-countdown');
  if(!pause||!countdown)return {ok:false,reason:'missing-death-ui-node'};
  const snapshot={
    dying,dyingT,paused,running,
    pauseOn:pause.classList.contains('on'),
    cursorHidden:document.body.classList.contains('cursor-hidden'),
    countdownClass:countdown.className,
    countdownStyle:countdown.getAttribute('style'),
    countdownText:countdown.textContent,
    countdownSeconds:countdown.dataset.seconds??null
  };
  const restore=()=>{
    escapeResumePending=false;
    dying=snapshot.dying;dyingT=snapshot.dyingT;paused=snapshot.paused;running=snapshot.running;
    pause.classList.toggle('on',snapshot.pauseOn);
    if(snapshot.countdownStyle===null)countdown.removeAttribute('style');else countdown.setAttribute('style',snapshot.countdownStyle);
    countdown.className=snapshot.countdownClass;
    countdown.textContent=snapshot.countdownText;
    if(snapshot.countdownSeconds===null)delete countdown.dataset.seconds;else countdown.dataset.seconds=snapshot.countdownSeconds;
    setGameCursorHidden(snapshot.cursorHidden);lastT=performance.now();
  };
  try{
    dying=true;dyingT=8;paused=false;running=false;pause.classList.remove('on');setGameCursorHidden(true);
    updateRespawnCountdownPresentation();
    const countdownBackground=getComputedStyle(countdown).backgroundImage;
    window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true}));
    const afterOpen={
      pauseOpened:pause.classList.contains('on'),
      paused,
      running,
      cursorHidden:document.body.classList.contains('cursor-hidden')
    };
    window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true}));
    window.dispatchEvent(new KeyboardEvent('keyup',{key:'Escape',code:'Escape',bubbles:true}));
    const afterResume={
      pauseOpened:pause.classList.contains('on'),
      paused,
      running,
      cursorHidden:document.body.classList.contains('cursor-hidden')
    };
    return {
      ok:true,
      countdownBackground,
      countdownText:countdown.textContent,
      afterOpen,
      afterResume
    };
  }finally{
    restore();
  }
})()`);

if(!result?.ok||
  result.countdownBackground!=='none'||
  result.countdownText!=='8'||
  !result.afterOpen?.pauseOpened||
  !result.afterOpen?.paused||
  result.afterOpen?.running||
  result.afterOpen?.cursorHidden||
  result.afterResume?.pauseOpened||
  result.afterResume?.paused||
  result.afterResume?.running||
  !result.afterResume?.cursorHidden){
  session.close();
  throw new Error('death ESC menu / clean countdown regression: '+JSON.stringify(result));
}

if(session.hasFatalDiagnostics()){
  const fatal=session.fatalDiagnosticsTail(),events=session.diagnosticsTail();
  session.close();
  throw new Error('death UI smoke observed fatal browser diagnostics; fatal='+JSON.stringify(fatal)+'; events='+JSON.stringify(events));
}
const diagnostics=session.diagnosticsTail();
session.close();
console.log('Death ESC menu + clean respawn countdown smoke passed:',JSON.stringify({...result,diagnostics}));
