'use strict';

// ─── GAME SESSION / BROWSER LIFECYCLE ───────────────────────────────
// Canonical owner for pointer lock, pause/resume/start and page lifecycle.
// The frame loop reads lastT, but only this session owner resets it around
// browser/user lifecycle transitions so background time never leaks into dt.
let lastT=0;

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
  if(dying||perkPickOpen||lvlAnnOpen)return;
  clearPointerLockRequest();
  paused=true;running=false;mouseDown=false;zooming=false;setMobileFire(false);
  setGameCursorHidden(false);
  G('pause').classList.add('on');refreshMobileHUD();
}
function requestGamePointerLock(){
  if(IS_TOUCH||dying||perkPickOpen||lvlAnnOpen)return;
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
  if(dying||perkPickOpen||lvlAnnOpen)return;
  mouseDown=false;zooming=false;lastT=performance.now();refreshMobileHUD();
  G('pause').classList.remove('on');
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
  if(IS_TOUCH){
    tryFullscreen();tryLockLandscape();
    G('menu').style.display='none';G('pause').classList.remove('on');
    if(!running&&!dying&&!lvlAnnOpen&&!perkPickOpen){
      running=true;paused=false;lastT=performance.now();
      activatePreparedGame();
      wHUD();markHUD();flushHUD();xpHUD();updateStats();respawnShieldT=PLAYER_SPAWN_SHIELD_TIME;deathReason='';
    }else if(paused){resumeGameFromPause();}
    mobileStarted=true;refreshMobileHUD();updateOrientationState();
  }else{
    requestGamePointerLock();
  }
}

// ─── POINTER LOCK / TOUCH START ─────────
G('startBtn').addEventListener('click',startOrResumeGame);
G('resumeBtn').addEventListener('click',resumeGameFromPause);
G('fullscreenBtn').addEventListener('click',tryFullscreen);
G('restartBtn').addEventListener('click',restartGameFromScratch);
G('perk-reroll').addEventListener('click',rerollPerks);
window.addEventListener('keydown',e=>{
  if(!perkPickOpen)return;
  const n=parseInt(e.key);
  if(n>=1&&n<=currentPerkChoices.length){e.preventDefault();pickPerk(currentPerkChoices[n-1]);}
});

document.addEventListener('pointerlockchange',()=>{
  if(IS_TOUCH)return;
  clearPointerLockRequest();
  if(document.pointerLockElement===canvas){
    if(!preloadDone){document.exitPointerLock();return;}
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
    if(dying){
      // Киллкамера остаётся без видимого курсора. После неё respawn сам проверит,
      // сохранился ли pointer lock, и при необходимости откроет меню паузы.
      setGameCursorHidden(true);
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
    saveProgress(true);
    if(running&&!dying&&!lvlAnnOpen&&!perkPickOpen){
      if(IS_TOUCH)showPauseUI();
      else document.exitPointerLock();
    }
  }
});
window.addEventListener('pagehide',()=>saveProgress(true));
window.addEventListener('beforeunload',()=>saveProgress(true));
let escapeResumePending=false;
window.addEventListener('keydown',e=>{
  if(e.code!=='Escape'||e.repeat||dying||perkPickOpen||lvlAnnOpen||IS_TOUCH)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  if(paused){
    // Не запрашиваем Pointer Lock на keydown: браузер обрабатывает Escape после
    // события и мог сразу повторно снять только что полученный захват мыши.
    escapeResumePending=true;
    return;
  }
  escapeResumePending=false;
  if(document.pointerLockElement===canvas){
    document.exitPointerLock();
  }else if(running){
    showPauseUI();
  }
},true);
window.addEventListener('keyup',e=>{
  if(e.code!=='Escape'||!escapeResumePending||dying||perkPickOpen||lvlAnnOpen||IS_TOUCH)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  escapeResumePending=false;
  resumeGameFromPause();
},true);
