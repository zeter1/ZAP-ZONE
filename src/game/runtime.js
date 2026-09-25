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
  tickGamePresentation(Math.min(Math.max(rawDt||0,0),.05),ts);

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

  // Camera recoil recovery follows the current weapon mass/handling profile.
  const activeW=getW();
  const recoilReturn=activeW.recoilReturn||12;
  if(weaponReadyT>0)weaponReadyT=Math.max(0,weaponReadyT-dt);
  if(weaponEquipT>0)weaponEquipT=Math.max(0,weaponEquipT-dt);
  if(sprintExitT>0)sprintExitT=Math.max(0,sprintExitT-dt);
  if(cycleT>0){cycleT=Math.max(0,cycleT-dt);if(cycleT<=0){cycleKind='';cycleTot=0;}}
  const scopedWeapon=activeW.aimMode==='scope';
  const adsWanted=!IS_TOUCH&&scopedWeapon&&zooming?1:0;
  const adsTime=adsWanted>adsBlend?(activeW.adsIn||.18):(activeW.adsOut||.12);
  const adsStep=dt/Math.max(.04,adsTime);
  adsBlend+=Math.max(-adsStep,Math.min(adsStep,adsWanted-adsBlend));
  weaponBloom=Math.max(0,weaponBloom-(activeW.bloomDecay||.045)*dt);
  if(shotResetT>0){shotResetT-=dt;if(shotResetT<=0)shotSequence=0;}
  if(recoilRecovery>0){
    recoilRecovery-=dt;
    const recRate=recoilReturn*.62*dt;
    recoilPitch=recoilPitch>0?Math.max(0,recoilPitch-recRate):Math.min(0,recoilPitch+recRate);
    recoilYaw=recoilYaw>0?Math.max(0,recoilYaw-recRate*.48):Math.min(0,recoilYaw+recRate*.48);
  } else {
    const recRate=recoilReturn*dt;
    recoilPitch=recoilPitch>0?Math.max(0,recoilPitch-recRate):Math.min(0,recoilPitch+recRate);
    recoilYaw=recoilYaw>0?Math.max(0,recoilYaw-recRate*.60):Math.min(0,recoilYaw+recRate*.60);
  }

  // Apply recoil to actual aim
  const effPitch=Math.max(-1.2,Math.min(1.2,pitch+recoilPitch));
  const effYaw=yaw+recoilYaw;

  _euler.x=effPitch;_euler.y=effYaw;camera.quaternion.setFromEuler(_euler);

  const scopeActive=!IS_TOUCH&&scopedWeapon&&adsBlend>.88;
  const scopedFov=scopedWeapon?(activeW.zoomFov||ZOOM_FOV):BASE_FOV;
  const scopeBreath=scopedWeapon?Math.sin(ts*.00145)*.10*adsBlend:0;
  const targetFov=BASE_FOV+(scopedFov-BASE_FOV)*adsBlend+scopeBreath;
  if(Math.abs(camera.fov-targetFov)>.025){
    camera.fov+=(targetFov-camera.fov)*Math.min(1,dt*13);
    camera.updateProjectionMatrix();
  }
  const sniperScope=G('sniper-scope');
  if(sniperScope)sniperScope.classList.toggle('on',scopeActive);
  const crosshair=G('xhair');
  if(crosshair){
    crosshair.classList.toggle('scope-hidden',scopeActive||scopedWeapon);
    const reticlePellet=activeW.pellets>1?1:0;
    const reticleSpread=effectiveWeaponSpread(activeW,reticlePellet,false,weaponBloom,shotSequence===0);
    const gap=5+Math.min(18,reticleSpread*260);
    crosshair.style.setProperty('--xh-gap',gap.toFixed(1)+'px');
  }
  gunGrp.visible=!scopeActive;

  // Movement
  const lowHpActive=hp<plr.maxHp*.35;
  const runHeld=(K['ShiftLeft']||K['ShiftRight']||mobileInput.run);
  const sprintAllowed=!reloading&&!zooming&&weaponEquipT<=0&&cycleT<=0;
  const wantsSprint=!!runHeld&&sprintAllowed;
  damageFlashAlpha=Math.max(0,damageFlashAlpha-damageFlashDecay*dt);
  setDamageOverlay(damageFlashAlpha);
  const spd=(wantsSprint?8*plr.sprintM:5)*plr.spdM*(lowHpActive?1+plr.lowHpSpeed:1);
  _fwd.set(-Math.sin(yaw),0,-Math.cos(yaw));_rgt.set(Math.cos(yaw),0,-Math.sin(yaw));_mv.set(0,0,0);
  if(K['KeyW'])_mv.addScaledVector(_fwd,spd);if(K['KeyS'])_mv.addScaledVector(_fwd,-spd);
  if(K['KeyA'])_mv.addScaledVector(_rgt,-spd);if(K['KeyD'])_mv.addScaledVector(_rgt,spd);
  if(Math.abs(mobileInput.moveY)>.05)_mv.addScaledVector(_fwd,-mobileInput.moveY*spd);
  if(Math.abs(mobileInput.moveX)>.05)_mv.addScaledVector(_rgt,mobileInput.moveX*spd);
  const sprintingNow=wantsSprint&&_mv.lengthSq()>.05&&onGnd;
  if(sprintingNow&&zooming)zooming=false;
  const sprintTarget=sprintingNow?1:0;
  const sprintStep=dt*(sprintingNow?8.5:11.5);
  sprintBlend+=Math.max(-sprintStep,Math.min(sprintStep,sprintTarget-sprintBlend));
  if(wasWeaponSprinting&&!sprintingNow)sprintExitT=Math.max(sprintExitT,activeW.sprintRecover||.15);
  wasWeaponSprinting=sprintingNow;
  if(crosshair)crosshair.classList.toggle('weapon-lowered',sprintingNow||weaponEquipT>0||sprintExitT>0);
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

  // Only true automatic weapons repeat while fire is held.
  const fireW=getW();
  if((mouseDown||mobileInput.fire)&&fireW.automatic&&!reloading&&sCD<=0&&!weaponActionBlocked()){
    autoFireT-=dt;
    if(autoFireT<=0){shoot();autoFireT=fireW.rate;}
  } else {autoFireT=0;}

  // Gun
  const moving=_mv.length()>.1;
  const bob=moving?Math.sin(ts*.009)*.012:0;
  const bobSide=moving?Math.cos(ts*.0045)*.008:0;
  recoil*=.82;
  gunSwayX*=Math.max(0,1-dt*7.5);gunSwayY*=Math.max(0,1-dt*7.5);
  if(reloading&&reloadTot>0){
    const p=1-(reloadT/reloadTot);
    const shellReload=reloadMode==='shell';
    gunGrp.position.set(
      gunBasePos.x+bobSide+Math.sin(p*Math.PI)*(shellReload ? .045 : .08),
      gunBasePos.y+bob+Math.sin(p*Math.PI)*(shellReload?-.12:-.22),
      gunBasePos.z+(shellReload ? .01 : .03)
    );
    gunGrp.rotation.x=Math.sin(p*Math.PI)*(shellReload ? .30 : .62);
    gunGrp.rotation.y=-gunSwayX*.9;
    gunGrp.rotation.z=Math.sin(p*Math.PI*2)*(shellReload ? .08 : .16);
    G('reload-fill').style.width=(p*100).toFixed(1)+'%';
  } else if(weaponEquipT>0&&weaponEquipTot>0){
    const p=1-weaponEquipT/weaponEquipTot,ease=1-Math.pow(1-p,3);
    gunGrp.position.set(gunBasePos.x+.16*(1-ease),gunBasePos.y-.30*(1-ease),gunBasePos.z+.15*(1-ease));
    gunGrp.rotation.x=.42*(1-ease);gunGrp.rotation.y=-.22*(1-ease);gunGrp.rotation.z=.18*(1-ease);
  } else if(sprintBlend>.01){
    const sb=sprintBlend;
    gunGrp.position.set(gunBasePos.x+.15*sb,gunBasePos.y-.18*sb,gunBasePos.z+.10*sb);
    gunGrp.rotation.x=.38*sb;gunGrp.rotation.y=-.30*sb;gunGrp.rotation.z=.14*sb;
  } else {
    const swayM=1-adsBlend*.72,bobM=1-adsBlend*.70;
    const adsX=gunBasePos.x*(1-adsBlend*.94);
    const adsY=gunBasePos.y+adsBlend*.035;
    const adsZ=gunBasePos.z-adsBlend*.075;
    const cycleP=cycleTot>0?1-cycleT/cycleTot:0;
    const cycleWave=cycleT>0?Math.sin(cycleP*Math.PI):0;
    if(cycleT>0&&!cycleEjected&&cycleP>.38&&(cycleKind==='pump'||cycleKind==='bolt')){
      const casingPos=camera.position.clone().addScaledVector(new THREE.Vector3(.22,-.08,-.22).applyQuaternion(camera.quaternion),1);
      ejectCasing(casingPos,camera.quaternion,cycleKind==='pump');
      cycleEjected=true;
    }
    const pumpZ=cycleKind==='pump'?cycleWave*.11:0;
    const boltX=cycleKind==='bolt'?cycleWave*.055:0;
    const cycleRot=cycleKind==='bolt'?cycleWave*.10:(cycleKind==='pump'?cycleWave*.055:0);
    gunGrp.position.set(adsX+bobSide*bobM-gunSwayX*swayM+boltX,adsY+bob*bobM-gunSwayY*swayM,adsZ+recoil*.08+pumpZ);
    gunGrp.rotation.x=recoil*.16+gunSwayY*.8*swayM+cycleRot;gunGrp.rotation.y=-gunSwayX*.9*swayM;gunGrp.rotation.z=bobSide*.8*bobM+(cycleKind==='bolt'?cycleWave*.08:0);
  }
  if(beamM){if(beamT>0){beamT-=dt;beamM.material.opacity=(beamT/.065)*.85;if(flashM)flashM.material.opacity=beamT/.065;}else{beamM.material.opacity=0;if(flashM)flashM.material.opacity=0;}}

  if(sCD>0)sCD-=dt;
  if(reloading){reloadT-=dt;if(reloadT<=0)completePlayerReloadStep();}
  updateWeaponStateHUD();

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

  // Respawn dead bots to maintain 5v5: player + 4 allies versus 5 enemies
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
  tickParticles(dt);tickGibs(dt);tickCasings(dt);tickImpactMarks(dt);tickExpLights(dt);tickMzLights(dt);tickBombBlastWaves(dt);tickHeadshotFx(dt);tickExplosionFx(dt);tickCombatImpactFx(dt);tickEnvironment(dt);

  // Update ally panel
  updateAllyPanel(dt);

  if(!webglLost)renderFrame();
}

let allyPanelCd=0;
function updateAllyPanel(dt){
  allyPanelCd-=dt;if(allyPanelCd>0)return;allyPanelCd=.20;
  const panel=G('ally-panel');
  const squad=enemies.filter(e=>e.alive&&e.team==='ally').sort((a,b)=>(b.kills||0)-(a.kills||0));
  panel.innerHTML=squad.map((e,i)=>{
    const pct=Math.round(e.hp/e.maxHp*100);
    return `<div class="ally-icon" style="border-color:rgba(64,210,255,.72);background:rgba(0,48,96,.76);color:#b8f2ff;box-shadow:0 0 7px rgba(50,190,255,.25);"><img class="leader-bot-icon" src="${GAME_ASSETS.characters.ally}" alt=""> СВОЙ ${i+1}: ${e.kills||0} ☠ · ${pct}%</div>`;
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
preloadGameContent().then(()=>{
  document.documentElement.dataset.zapBoot='ready';
}).catch(err=>{
  console.error('ZAP ZONE boot failed',err);
  document.documentElement.dataset.zapBoot='failed';
});
