'use strict';

// ─── MAIN LOOP ──────────────────────────
let lastT=0;
const _euler=new THREE.Euler(0,0,0,'YXZ');
const _fwd=new THREE.Vector3(),_rgt=new THREE.Vector3(),_mv=new THREE.Vector3();
let prevPX=0,prevPZ=0;
// Auto-fire timer
let autoFireT=0;

function loop(ts){
  requestAnimationFrame(loop);
  const rawDt=(ts-lastT)/1000;

  if(webglLost){lastT=ts;return;}
  // Страховка от редкого сброса pointer lock: если курсор появился во время
  // активной игры, симуляция сразу ставится на паузу и открывает нормальное меню.
  if(!IS_TOUCH&&running&&!paused&&!dying&&!perkPickOpen&&!lvlAnnOpen&&document.pointerLockElement!==canvas){
    showPauseUI();lastT=ts;renderFrame();return;
  }
  if(dying){
    const deathDt=Math.min(Math.max(rawDt,0),.033);lastT=ts;
    dyingT-=deathDt;
    tickDeathWorld(deathDt);
    tickDeathCamera(deathDt);
    if(dyingT<=0){doRespawn();return;}
    renderFrame();return;
  }
  if(portraitBlocked){lastT=ts;renderFrame();return;}
  if(lvlAnnOpen){lastT=ts;tickLvlAnn(Math.min(rawDt,.05));renderFrame();return;}
  if(perkPickOpen||paused){lastT=ts;renderFrame();return;}
  if(!running){lastT=ts;renderFrame();return;}

  const dt=Math.min(rawDt,.033);lastT=ts;

  // Camera recoil recovery
  if(recoilRecovery>0){
    recoilRecovery-=dt;
    const recRate=8*dt;
    recoilPitch=recoilPitch>0?Math.max(0,recoilPitch-recRate):Math.min(0,recoilPitch+recRate);
    recoilYaw=recoilYaw>0?Math.max(0,recoilYaw-recRate*.5):Math.min(0,recoilYaw+recRate*.5);
  } else {
    const recRate=12*dt;
    recoilPitch=recoilPitch>0?Math.max(0,recoilPitch-recRate):Math.min(0,recoilPitch+recRate);
    recoilYaw=recoilYaw>0?Math.max(0,recoilYaw-recRate*.6):Math.min(0,recoilYaw+recRate*.6);
  }

  // Apply recoil to actual aim
  const effPitch=Math.max(-1.2,Math.min(1.2,pitch+recoilPitch));
  const effYaw=yaw+recoilYaw;

  _euler.x=effPitch;_euler.y=effYaw;camera.quaternion.setFromEuler(_euler);

  const targetFov=!IS_TOUCH&&zooming?ZOOM_FOV:BASE_FOV;
  if(Math.abs(camera.fov-targetFov)>.05){
    camera.fov+=(targetFov-camera.fov)*Math.min(1,dt*10);
    camera.updateProjectionMatrix();
  }

  // Movement
  const lowHpActive=hp<plr.maxHp*.35;
  const runHeld=(K['ShiftLeft']||K['ShiftRight']||mobileInput.run);
  damageFlashAlpha=Math.max(0,damageFlashAlpha-damageFlashDecay*dt);
  setDamageOverlay(damageFlashAlpha);
  const spd=(runHeld?8*plr.sprintM:5)*plr.spdM*(lowHpActive?1+plr.lowHpSpeed:1);
  _fwd.set(-Math.sin(yaw),0,-Math.cos(yaw));_rgt.set(Math.cos(yaw),0,-Math.sin(yaw));_mv.set(0,0,0);
  if(K['KeyW'])_mv.addScaledVector(_fwd,spd);if(K['KeyS'])_mv.addScaledVector(_fwd,-spd);
  if(K['KeyA'])_mv.addScaledVector(_rgt,-spd);if(K['KeyD'])_mv.addScaledVector(_rgt,spd);
  if(Math.abs(mobileInput.moveY)>.05)_mv.addScaledVector(_fwd,-mobileInput.moveY*spd);
  if(Math.abs(mobileInput.moveX)>.05)_mv.addScaledVector(_rgt,mobileInput.moveX*spd);
  if((K['Space']||mobileInput.jumpQueued)&&onGnd){jumpV=6*plr.jumpM;onGnd=false;mobileInput.jumpQueued=false;}
  jumpV-=22*dt;camera.position.y+=jumpV*dt;
  if(camera.position.y<=1.75){camera.position.y=1.75;onGnd=true;jumpV=0;}

  // Apply movement with wall collision
  let newX=camera.position.x+_mv.x*dt;
  let newZ=camera.position.z+_mv.z*dt;
  newX=Math.max(-93,Math.min(93,newX));
  newZ=Math.max(-93,Math.min(93,newZ));
  const coll=collideWalls(newX,newZ,PLR_R);
  camera.position.x=coll.x;
  camera.position.z=coll.z;

  // Track velocity
  if(dt>0.001){plrVx=(camera.position.x-prevPX)/dt;plrVz=(camera.position.z-prevPZ)/dt;}
  prevPX=camera.position.x;prevPZ=camera.position.z;

  // Auto-fire when holding mouse / mobile fire
  if((mouseDown||mobileInput.fire)&&!reloading&&sCD<=0){
    autoFireT-=dt;
    if(autoFireT<=0){shoot();autoFireT=getW().rate;}
  } else {autoFireT=0;}

  // Gun
  const moving=_mv.length()>.1;
  const bob=moving?Math.sin(ts*.009)*.012:0;
  const bobSide=moving?Math.cos(ts*.0045)*.008:0;
  recoil*=.82;
  gunSwayX*=Math.max(0,1-dt*7.5);gunSwayY*=Math.max(0,1-dt*7.5);
  if(reloading&&reloadTot>0){
    const p=1-(reloadT/reloadTot);
    gunGrp.position.set(gunBasePos.x+bobSide+Math.sin(p*Math.PI)*.08,gunBasePos.y+bob+Math.sin(p*Math.PI)*(-.22),gunBasePos.z+.03);
    gunGrp.rotation.x=Math.sin(p*Math.PI)*.62;gunGrp.rotation.y=-gunSwayX*.9;gunGrp.rotation.z=Math.sin(p*Math.PI*2)*.16;
    G('reload-fill').style.width=(p*100).toFixed(1)+'%';
  } else {
    gunGrp.position.set(gunBasePos.x+bobSide-gunSwayX,gunBasePos.y+bob-gunSwayY,gunBasePos.z+recoil*.08);
    gunGrp.rotation.x=recoil*.16+gunSwayY*.8;gunGrp.rotation.y=-gunSwayX*.9;gunGrp.rotation.z=bobSide*.8;
  }
  if(beamM){if(beamT>0){beamT-=dt;beamM.material.opacity=(beamT/.065)*.85;if(flashM)flashM.material.opacity=beamT/.065;}else{beamM.material.opacity=0;if(flashM)flashM.material.opacity=0;}}

  if(sCD>0)sCD-=dt;
  if(reloading){reloadT-=dt;if(reloadT<=0){const w=getW(),need=w.clip-ammo,take=Math.min(need,uAmmo);ammo+=take;uAmmo-=take;syncCurrentAmmo();reloading=false;reloadTot=0;wHUD();G('rmsg').style.opacity='0';G('reload-wrap').style.display='none';}}

  if(noAmmoT>0){noAmmoT-=dt;if(noAmmoT<=0)G('no-ammo').style.opacity='0';}
  if(respawnShieldT>0){respawnShieldT=Math.max(0,respawnShieldT-dt);}
  if(playerMineCD>0){
    playerMineCD=Math.max(0,playerMineCD-dt);
    const sec=Math.ceil(playerMineCD);
    if(sec!==mineHudSecond){mineHudSecond=sec;updateMineHUD();}
  }
  if(playerBombCD>0){
    playerBombCD=Math.max(0,playerBombCD-dt);
    const sec=Math.ceil(playerBombCD);
    if(sec!==bombHudSecond){bombHudSecond=sec;updateMineHUD();}
  }
  if(playerSmokeCD>0){
    playerSmokeCD=Math.max(0,playerSmokeCD-dt);
    const sec=Math.ceil(playerSmokeCD);
    if(sec!==smokeHudSecond){smokeHudSecond=sec;if(getW().isSmoke)wHUD();}
    if(playerSmokeCD<=0){setWeaponAmmo(SMOKE_WEAPON_INDEX,1);if(getW().isSmoke)wHUD();showMsg('🌫️ Дымовуха снова готова');}
  }
  if(plr.regen>0){hp=Math.min(hp+plr.regen*dt,plr.maxHp);markHUD();}
  if(plr.armorRegen>0&&armor<plr.maxArmor){armor=Math.min(plr.maxArmor,armor+plr.armorRegen*dt);markHUD();}
  if(combo>0){comboT-=dt;if(comboT<=0)combo=0;}
  saveTick-=dt;
  if(saveTick<=0){saveTick=8;saveProgress();}

  // Respawn dead bots to maintain 1 player + 9 bots
  spawnT-=dt;
  if(spawnT<=0){
    spawnT=1.7+Math.random()*1.0;
    // Clean dead
    for(let i=enemies.length-1;i>=0;i--){if(!enemies[i].alive)enemies.splice(i,1);}
    const ac=countTeam('ally'), ec=countTeam('enemy');
    while(ac+0<ALLY_BOT_TARGET&&countTeam('ally')<ALLY_BOT_TARGET)spawnBot('ally');
    while(ec+0<TEAM_SIZE&&countTeam('enemy')<TEAM_SIZE)spawnBot('enemy');
  }

  // Update enemies
  let touched=false;
  for(const en of enemies){
    if(!en.alive)continue;
    const mel=en.update(dt);
    if(mel){let dmg=(9+en.type*2.8)*(1+level*.045+Math.min(.25,kills*.003))*dt;applyDamageToPlayer(dmg,'melee',en);touched=true;}
  }
  if(touched)markHUD();

  flushHUD();
  tickProjectiles(dt);tickMines(dt);tickSmoke(dt);tickPickups(dt);
  tickParticles(dt);tickGibs(dt);tickCasings(dt);tickImpactMarks(dt);tickExpLights(dt);tickMzLights(dt);tickBombBlastWaves(dt);

  // Update ally panel
  updateAllyPanel(dt);

  if(!webglLost)renderFrame();
}

let allyPanelCd=0;
function updateAllyPanel(dt){
  allyPanelCd-=dt;if(allyPanelCd>0)return;allyPanelCd=.20;
  const panel=G('ally-panel');
  const leaders=enemies.filter(e=>e.alive).sort((a,b)=>(b.kills||0)-(a.kills||0)).slice(0,3);
  panel.innerHTML=leaders.map((e,i)=>{
    const pct=Math.round(e.hp/e.maxHp*100);
    return `<div class="ally-icon" style="border-color:rgba(255,80,80,.5);background:rgba(90,0,0,.62);color:#ffaaaa;">🔴 Бот ${i+1}: ${e.kills||0} ☠ · ${pct}%</div>`;
  }).join('');
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

// ─── BOOT ───────────────────────────────
setGameCursorHidden(false);
buildGun(getW());buildWeaponBar();bindMobileControls();updateMineHUD();updateStats();updateTeamScore();updateOrientationState();refreshMobileHUD();xpHUD();refreshStartButton();
requestAnimationFrame(loop);
preloadGameContent();
