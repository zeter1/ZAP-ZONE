'use strict';

// ─── GAME SESSION / BROWSER LIFECYCLE ───────────────────────────────
// Canonical owner for pointer lock, pause/resume/start and page lifecycle.
// The frame loop reads lastT, but only this session owner resets it around
// browser/user lifecycle transitions so background time never leaks into dt.
let lastT=0;
const MATCH_DURATION_SECONDS=8*60;
let matchRemaining=MATCH_DURATION_SECONDS;

function matchClockText(){
  const seconds=Math.ceil(matchRemaining);
  return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
}
function updateMatchClock(){
  const clock=G('match-clock'),text=matchClockText();
  if(clock.textContent!==text)clock.textContent=text;
}
function restoreMatchClock(seconds){
  matchRemaining=Number.isFinite(seconds)?Math.max(0,Math.min(MATCH_DURATION_SECONDS,seconds)):MATCH_DURATION_SECONDS;
  updateMatchClock();
}
function advanceMatchClock(dt){
  matchRemaining=Math.max(0,matchRemaining-dt);
  updateMatchClock();
  if(matchRemaining===0)finishMatch();
}
function syncPausePanelPresentation(){
  const el=G('pause');if(!el||el.dataset.generatedPanel==='1')return;
  if(applyPresentationAtlasVariables(el,'pause-panel',presentationAtlasFrame(GAME_ASSETS.presentationHudV3.pausePanel)))el.dataset.generatedPanel='1';
}

function tryFullscreen(){
  const el=document.documentElement;
  if(el.requestFullscreen&&!document.fullscreenElement){
    el.requestFullscreen().catch(()=>{});
  }
}
function setGameCursorHidden(hidden){
  const shouldHide=!!hidden;
  document.body.classList.toggle('cursor-hidden',shouldHide);
  canvas.style.cursor=shouldHide?'none':'default';
}
function clearPointerLockRequest(){
  pointerLockRequestPending=false;
  if(pointerLockRequestTimer){clearTimeout(pointerLockRequestTimer);pointerLockRequestTimer=0;}
}
function showPauseUI(){
  if(matchRemaining===0||perkPickOpen||lvlAnnOpen)return;
  clearPointerLockRequest();
  releaseCombatInput();
  paused=true;running=false;setMobileFire(false);
  setGameCursorHidden(false);
  syncPausePanelPresentation();
  G('pause-ally-score').textContent=allyControlScore;
  G('pause-enemy-score').textContent=enemyControlScore;
  G('pause-zone').textContent=frontlineZone().label;
  G('pause-match-clock').textContent=matchClockText();
  const pause=G('pause');
  const wasOpen=pause.classList.contains('on');
  pause.classList.add('on');refreshMobileHUD();
  if(!wasOpen)G('resumeBtn').focus({preventScroll:true});
}
function requestGamePointerLock(){
  if(matchRemaining===0||IS_TOUCH||dying||perkPickOpen||lvlAnnOpen)return;
  if(document.pointerLockElement===canvas){
    clearPointerLockRequest();setGameCursorHidden(true);return;
  }
  if(pointerLockRequestPending)return;
  pointerLockRequestPending=true;
  // В обычном меню курсор остаётся видимым до успешного захвата. Если меню уже
  // закрыто (например, после выбора улучшения), скрываем курсор на время запроса.
  const interactiveMenuVisible=G('menu').style.display!=='none'||G('pause').classList.contains('on')||G('perk-menu').classList.contains('on');
  if(!interactiveMenuVisible)setGameCursorHidden(true);
  try{
    const result=canvas.requestPointerLock();
    if(result&&typeof result.catch==='function')result.catch(()=>{
      clearPointerLockRequest();
      if(!dying&&!perkPickOpen&&!lvlAnnOpen)showPauseUI();
    });
    pointerLockRequestTimer=setTimeout(()=>{
      if(pointerLockRequestPending&&document.pointerLockElement!==canvas){
        clearPointerLockRequest();
        if(!dying&&!perkPickOpen&&!lvlAnnOpen)showPauseUI();
      }
    },1200);
  }catch(err){
    clearPointerLockRequest();showPauseUI();
  }
}
function resumeGameFromPause(){
  if(!gameSessionActivated)prepareResumeProgress();
  if(matchRemaining===0){G('pause').classList.remove('on');showMatchResult();return;}
  if(perkPickOpen||lvlAnnOpen)return;
  mouseDown=false;zooming=false;lastT=performance.now();refreshMobileHUD();
  G('pause').classList.remove('on');
  if(dying){paused=false;running=false;setGameCursorHidden(true);refreshMobileHUD();return;}
  if(IS_TOUCH){paused=false;running=true;return;}
  // Сразу закрываем меню, но запускаем игру только после успешного захвата мыши.
  // При ошибке requestGamePointerLock снова откроет меню паузы.
  setGameCursorHidden(true);
  paused=true;running=false;
  requestGamePointerLock();
}
function startOrResumeGame(){
  if(!preloadDone){
    setLoadingProgress(90,'Завершается подготовка игры...');
    G('loading')?.classList.remove('hidden');
    return;
  }
  if(!gameSessionActivated)prepareResumeProgress();
  if(matchRemaining===0){showMatchResult();return;}
  if(IS_TOUCH){
    tryFullscreen();tryLockLandscape();
    G('menu').style.display='none';G('pause').classList.remove('on');
    if(!running&&!dying&&!lvlAnnOpen&&!perkPickOpen){
      const firstStart=!gameSessionActivated;
      running=true;paused=false;lastT=performance.now();
      activatePreparedGame();
      wHUD();markHUD();flushHUD();xpHUD();updateStats();respawnShieldT=PLAYER_SPAWN_SHIELD_TIME;deathReason='';
    }else if(paused){resumeGameFromPause();}
    activateMobileControls();
  }else{
    requestGamePointerLock();
  }
}

function activateMobileControls(){
  mobileStarted=true;refreshMobileHUD();updateOrientationState();
}

function toggleMatchFullscreen(){
  if(document.fullscreenElement){
    document.exitFullscreen().catch(()=>{});
  }else{
    tryFullscreen();
  }
}

const matchHelpDialog=G('match-help');
const matchRestartDialog=G('match-restart');
const matchFullscreenButton=G('fullscreenBtn');
const matchResultDialog=G('match-result');

function showMatchResult(){
  const {ally,enemy}=teamMatchScores();
  G('match-result-title').textContent=ally===enemy?'Ничья':ally>enemy?'Победа синих':'Победа красных';
  G('result-ally-score').textContent=ally;
  G('result-enemy-score').textContent=enemy;
  G('result-ally-captures').textContent=allyControlScore;
  G('result-enemy-captures').textContent=enemyControlScore;
  if(!matchResultDialog.open)matchResultDialog.showModal();
}

function finishMatch(){
  running=false;paused=false;mouseDown=false;zooming=false;
  lvlAnnOpen=false;perkPickOpen=false;escapeResumePending=false;
  clearPointerLockRequest();
  releaseCombatInput();
  clearFrontlineRally();
  setMobileFire(false);refreshMobileHUD();
  setGameCursorHidden(false);
  if(document.pointerLockElement===canvas)document.exitPointerLock();
  G('pause').classList.remove('on');
  G('perk-menu').classList.remove('on');
  G('lvl-ann').classList.remove('on');
  G('menu').style.display='';
  saveProgress(true);refreshStartButton();
  showMatchResult();
}

function openMatchRestart(fromMenu){
  escapeResumePending=false;
  G('match-restart-title').textContent=fromMenu?'Начать новый матч?':'Начать матч заново?';
  G('matchRestartConfirm').textContent=fromMenu?'Новый матч':'Начать заново';
  matchRestartDialog.showModal();
}

// ─── POINTER LOCK / TOUCH START ─────────
G('startBtn').addEventListener('click',startOrResumeGame);
G('resumeBtn').addEventListener('click',resumeGameFromPause);
matchFullscreenButton.hidden=!document.fullscreenEnabled;
matchFullscreenButton.addEventListener('click',toggleMatchFullscreen);
document.addEventListener('fullscreenchange',()=>{
  matchFullscreenButton.setAttribute('aria-pressed',String(!!document.fullscreenElement));
});
for(const id of ['menuHelpBtn','pauseHelpBtn']){
  G(id).addEventListener('click',()=>{
    escapeResumePending=false;
    matchHelpDialog.showModal();
  });
}
G('matchHelpClose').addEventListener('click',()=>matchHelpDialog.close());
G('newMatchBtn').addEventListener('click',()=>openMatchRestart(true));
G('restartBtn').addEventListener('click',()=>openMatchRestart(false));
G('matchRestartCancel').addEventListener('click',()=>matchRestartDialog.close());
G('matchRestartConfirm').addEventListener('click',()=>{
  const startingOnTouch=IS_TOUCH&&!gameSessionActivated;
  matchRestartDialog.close();
  if(startingOnTouch){tryFullscreen();tryLockLandscape();}
  restartGameFromScratch();
  if(startingOnTouch)activateMobileControls();
});
G('matchResultNew').addEventListener('click',()=>{
  matchResultDialog.close();
  restartGameFromScratch();
});
G('perk-reroll').addEventListener('click',rerollPerks);
window.addEventListener('keydown',e=>{
  if(!perkPickOpen)return;
  if(e.key==='Tab'){
    const buttons=[...G('perk-box').querySelectorAll('button:not(:disabled)')];
    const first=buttons[0],last=buttons[buttons.length-1];
    if(first&&(!G('perk-box').contains(document.activeElement)||(e.shiftKey&&document.activeElement===first)||(!e.shiftKey&&document.activeElement===last))){
      e.preventDefault();(e.shiftKey?last:first).focus();
    }
    return;
  }
  const n=parseInt(e.key);
  if(n>=1&&n<=currentPerkChoices.length){e.preventDefault();pickPerk(currentPerkChoices[n-1]);}
});

document.addEventListener('pointerlockchange',()=>{
  if(IS_TOUCH)return;
  clearPointerLockRequest();
  if(document.pointerLockElement===canvas){
    if(!preloadDone||matchRemaining===0){document.exitPointerLock();return;}
    const firstStart=!gameSessionActivated;
    setGameCursorHidden(true);
    G('menu').style.display='none';G('pause').classList.remove('on');
    paused=false;running=true;lastT=performance.now();
    if(firstStart){
      activatePreparedGame();
      wHUD();markHUD();flushHUD();xpHUD();updateStats();
      respawnShieldT=PLAYER_SPAWN_SHIELD_TIME;deathReason='';
    }
  }else{
    mouseDown=false;zooming=false;
    if(matchRemaining===0){
      setGameCursorHidden(false);
    }else if(dying){
      // Во время обычной киллкамеры курсор скрыт, но ESC-пауза должна оставлять
      // его видимым, чтобы меню было реально интерактивным.
      setGameCursorHidden(!paused);
    }else if(perkPickOpen){
      setGameCursorHidden(false);
    }else if(lvlAnnOpen){
      setGameCursorHidden(true);
    }else if(gameSessionActivated||running||paused){
      showPauseUI();
    }else{
      setGameCursorHidden(false);
    }
  }
  refreshMobileHUD();
});
document.addEventListener('pointerlockerror',()=>{
  if(IS_TOUCH)return;
  clearPointerLockRequest();
  if(!dying&&!perkPickOpen&&!lvlAnnOpen)showPauseUI();
});
window.addEventListener('blur',()=>{
  if(IS_TOUCH||dying)return;
  if(running&&!paused&&!perkPickOpen&&!lvlAnnOpen){
    saveProgress(true);
    if(document.pointerLockElement===canvas)document.exitPointerLock();
    else showPauseUI();
  }
});
window.addEventListener('focus',()=>{lastT=performance.now();});
document.addEventListener('visibilitychange',()=>{
  if(!document.hidden)lastT=performance.now();
  if(document.hidden){
    if(gameSessionActivated)saveProgress(true);
    if(running&&!dying&&!lvlAnnOpen&&!perkPickOpen){
      if(IS_TOUCH)showPauseUI();
      else document.exitPointerLock();
    }
  }
});
function saveActiveSession(){
  if(gameSessionActivated)saveProgress(true);
}
window.addEventListener('pagehide',saveActiveSession);
window.addEventListener('beforeunload',saveActiveSession);
window.addEventListener('storage',e=>{
  if(!gameSessionActivated&&(e.key===null||GAMEPLAY_SAVE_KEYS.includes(e.key)))refreshStartButton();
});
let escapeResumePending=false;
window.addEventListener('keydown',e=>{
  if(e.code!=='Escape'||e.repeat||perkPickOpen||lvlAnnOpen||IS_TOUCH)return;
  if(settingsDialog.open||matchHelpDialog.open||matchRestartDialog.open||matchRemaining===0){
    escapeResumePending=false;
    return;
  }
  e.preventDefault();
  e.stopImmediatePropagation();
  if(paused){
    // Не запрашиваем Pointer Lock на keydown: браузер обрабатывает Escape после
    // события и мог сразу повторно снять только что полученный захват мыши.
    escapeResumePending=true;
    return;
  }
  escapeResumePending=false;
  if(dying){
    showPauseUI();
    if(document.pointerLockElement===canvas)document.exitPointerLock();
    return;
  }
  if(document.pointerLockElement===canvas){
    document.exitPointerLock();
  }else if(running){
    showPauseUI();
  }
},true);
window.addEventListener('keyup',e=>{
  if(e.code!=='Escape'||!escapeResumePending||perkPickOpen||lvlAnnOpen||IS_TOUCH)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  escapeResumePending=false;
  resumeGameFromPause();
},true);
