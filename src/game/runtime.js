'use strict';

// ─── MAIN LOOP ──────────────────────────
let idleRenderAt=0;
const _euler=new THREE.Euler(0,0,0,'YXZ');
const _fwd=new THREE.Vector3(),_rgt=new THREE.Vector3(),_mv=new THREE.Vector3();
let prevPX=0,prevPZ=0;
// Auto-fire timer
let autoFireT=0;

// Up to 75 ms of real elapsed time is simulated per frame (13.3 FPS).
// The old 33 ms cap made the entire game run in slow motion below 30 FPS.
const MAX_ACTIVE_STEP_SECONDS=.075;
function activeSimulationDelta(frameSeconds){
  return Number.isFinite(frameSeconds)?Math.max(0,Math.min(frameSeconds,MAX_ACTIVE_STEP_SECONDS)):0;
}

function loop(ts){
  if(!running||paused||dying||lvlAnnOpen||perkPickOpen){cancelPendingMineThrow(true);cancelPendingSmokeThrow(true);}
  if(!running||paused||dying||lvlAnnOpen||perkPickOpen||webglLost)cancelPendingBombPlant();
  requestAnimationFrame(loop);
  const rawDt=(ts-lastT)/1000;
  if(webglLost){lastT=ts;return;}
  const menuIdle=!running&&!dying&&!portraitBlocked&&!lvlAnnOpen&&!perkPickOpen&&!paused;
  if(menuIdle){
    clearMineWorldArt39();
    lastT=ts;
    if(ts-idleRenderAt>=180){idleRenderAt=ts;renderFrame();}
    return;
  }
  tickGamePresentation(Math.min(Math.max(rawDt||0,0),.05),ts);
  // Страховка от редкого сброса pointer lock: если курсор появился во время
  // активной игры, симуляция сразу ставится на паузу и открывает нормальное меню.
  if(!IS_TOUCH&&running&&!paused&&!dying&&!perkPickOpen&&!lvlAnnOpen&&document.pointerLockElement!==canvas){
    showPauseUI();lastT=ts;renderFrame();return;
  }
  if(dying){
    if(paused){lastT=ts;if(ts-idleRenderAt>=85){idleRenderAt=ts;renderFrame();}return;}
    const deathDt=activeSimulationDelta(rawDt);lastT=ts;
    dyingT-=deathDt;
    if(typeof updateRespawnCountdownPresentation==='function')updateRespawnCountdownPresentation();
    if(typeof tickGeneratedPlayerDeathVfx==='function')tickGeneratedPlayerDeathVfx(deathDt);
    tickDeathWorld(deathDt);
    tickDeathCamera(deathDt);
    if(dyingT<=0){doRespawn();return;}
    renderFrame();return;
  }
  if(portraitBlocked){lastT=ts;renderFrame();return;}
  if(lvlAnnOpen){lastT=ts;tickLvlAnn(Math.min(rawDt,.05));if(ts-idleRenderAt>=60){idleRenderAt=ts;renderFrame();}return;}
  if(perkPickOpen||paused){lastT=ts;if(ts-idleRenderAt>=85){idleRenderAt=ts;renderFrame();}return;}
  if(!running){lastT=ts;if(ts-idleRenderAt>=120){idleRenderAt=ts;renderFrame();}return;}

  const dt=activeSimulationDelta(rawDt);lastT=ts;
  sampleAdaptiveGraphics(rawDt);
  tickRocketFireCooldowns(dt);

  // Camera recoil recovery follows the current weapon mass/handling profile.
  const activeW=getW();
  const recoilReturn=activeW.recoilReturn||12;
  if(weaponReadyT>0)weaponReadyT=Math.max(0,weaponReadyT-dt);
  if(weaponEquipT>0)weaponEquipT=Math.max(0,weaponEquipT-dt);
  if(sprintExitT>0)sprintExitT=Math.max(0,sprintExitT-dt);
  if(cycleT>0){cycleT=Math.max(0,cycleT-dt);if(cycleT<=0){cycleKind='';cycleTot=0;}}
  const scopedWeapon=activeW.aimMode==='scope';
  const actionBlocksScope=typeof generatedFirstPersonActionBlocksScope==='function'&&generatedFirstPersonActionBlocksScope();
  const adsWanted=!IS_TOUCH&&scopedWeapon&&zooming&&!actionBlocksScope?1:0;
  const adsTime=adsWanted>adsBlend?(activeW.adsIn||.18):(activeW.adsOut||.12);
  const adsStep=dt/Math.max(.04,adsTime);
  adsBlend+=Math.max(-adsStep,Math.min(adsStep,adsWanted-adsBlend));
  weaponBloom=Math.max(0,weaponBloom-(activeW.bloomDecay||.045)*dt);
  if(shotResetT>0){shotResetT-=dt;if(shotResetT<=0)shotSequence=0;}
  if(activeW.key==='rifle'||activeW.key==='shotgun'||activeW.key==='pistol'){
    // recoilReturn is a decay rate, not radians/frame: retain the actual kick.
    const delayed=Math.min(dt,Math.max(0,recoilRecovery));
    recoilRecovery=Math.max(0,recoilRecovery-dt);
    const decay=Math.exp(-recoilReturn*(delayed*.62+(dt-delayed)));
    recoilPitch*=decay;recoilYaw*=decay;
    if(recoilRecovery<=0&&Math.abs(recoilPitch)<.00001)recoilPitch=0;
    if(recoilRecovery<=0&&Math.abs(recoilYaw)<.00001)recoilYaw=0;
  } else if(recoilRecovery>0){
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

  const scopeActive=!actionBlocksScope&&!IS_TOUCH&&scopedWeapon&&adsBlend>.88;
  const scopedFov=scopedWeapon?(activeW.zoomFov||ZOOM_FOV):BASE_FOV;
  const scopeBreath=activeW.isSniper?Math.sin(ts*.00145)*.10*adsBlend:0;
  const targetFov=BASE_FOV+(scopedFov-BASE_FOV)*adsBlend+scopeBreath;
  if(Math.abs(camera.fov-targetFov)>.025){
    camera.fov+=(targetFov-camera.fov)*Math.min(1,dt*13);
    camera.updateProjectionMatrix();
  }
  const sniperScope=G('sniper-scope');
  if(sniperScope){
    const scopeImg=sniperScope.querySelector('img');
    const wantedAsset=activeW.scopeAsset||GAME_ASSETS.ui.sniperScope;
    const fallbackAsset=activeW.scopeFallback||(activeW.key==='rifle'?GAME_ASSETS.ui.rifleScope:GAME_ASSETS.ui.sniperScope);
    if(scopeImg&&scopeImg.dataset.scopeAsset!==wantedAsset){
      scopeImg.dataset.scopeAsset=wantedAsset;
      imageAssetWithFallback(scopeImg,wantedAsset,fallbackAsset);
    }
    sniperScope.classList.toggle('rifle-scope',activeW.key==='rifle');
    sniperScope.classList.toggle('on',scopeActive);
  }
  const crosshair=G('xhair');
  if(crosshair){
    crosshair.classList.toggle('scope-hidden',activeW.key==='rifle'?false:scopeActive||scopedWeapon);
    crosshair.classList.toggle('rifle-reticle',activeW.key==='rifle');
    const reticlePellet=activeW.pellets>1?1:0;
    const reticleSpread=effectiveWeaponSpread(activeW,reticlePellet,false,weaponBloom,shotSequence===0);
    const gap=5+Math.min(18,reticleSpread*260);
    crosshair.style.setProperty('--xh-gap',gap.toFixed(1)+'px');
    if(crosshair.dataset.reticleKey!==activeW.key){
      const reticleFrame=reticlePresentationFrame(activeW.key);
      if(reticleFrame){
        applyPresentationAtlasVariables(crosshair,'reticle',reticleFrame);
        crosshair.classList.add('generated-reticle');
      }else crosshair.classList.remove('generated-reticle');
      crosshair.dataset.reticleKey=activeW.key;
    }
  }
  gunGrp.visible=!scopeActive;

  // Movement
  const lowHpActive=hp<plr.maxHp*.35;
  if(typeof setLowHealthCombatOverlay==='function'){
    const lowHpStrength=lowHpActive?Math.max(.18,Math.min(.72,.18+(1-Math.max(0,hp)/(plr.maxHp*.35))*.54)):0;
    setLowHealthCombatOverlay(lowHpStrength);
  }
  const runHeld=(K['ShiftLeft']||K['ShiftRight']||mobileInput.run);
  const crouchHeld=!IS_TOUCH&&playerCrouchHeld(K);
  const crouching=crouchHeld&&onGnd;
  let pendingGeneratedCycleCasing=0;
  const sprintAllowed=!crouchHeld&&!reloading&&!zooming&&weaponEquipT<=0&&cycleT<=0;
  const wantsSprint=!!runHeld&&sprintAllowed;
  damageFlashAlpha=Math.max(0,damageFlashAlpha-damageFlashDecay*dt);
  setDamageOverlay(damageFlashAlpha);
  const stanceSpeedM=crouching?PLAYER_CROUCH_SPEED_M:1;
  const spd=(wantsSprint?8*plr.sprintM:5)*stanceSpeedM*plr.spdM*(lowHpActive?1+plr.lowHpSpeed:1);
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
  if((K['Space']||mobileInput.jumpQueued)&&onGnd&&!crouchHeld){jumpV=6*plr.jumpM;onGnd=false;mobileInput.jumpQueued=false;}
  if(onGnd){
    jumpV=0;
    const targetEyeHeight=crouching?PLAYER_CROUCH_EYE_HEIGHT:PLAYER_STAND_EYE_HEIGHT;
    camera.position.y=approachPlayerEyeHeight(camera.position.y,targetEyeHeight,dt);
  }else{
    jumpV-=22*dt;camera.position.y+=jumpV*dt;
    if(camera.position.y<=PLAYER_STAND_EYE_HEIGHT){
      camera.position.y=PLAYER_STAND_EYE_HEIGHT;
      onGnd=true;jumpV=0;
    }
  }

  // Apply movement with wall collision
  let newX=camera.position.x+_mv.x*dt;
  let newZ=camera.position.z+_mv.z*dt;
  newX=Math.max(-93,Math.min(93,newX));
  newZ=Math.max(-93,Math.min(93,newZ));
  const coll=collideWalls(newX,newZ,PLR_R);
  camera.position.x=coll.x;
  camera.position.z=coll.z;

  // Track velocity and drive footsteps from real travelled distance.
  const playerMoved=Math.hypot(camera.position.x-prevPX,camera.position.z-prevPZ);
  if(dt>0.001){plrVx=(camera.position.x-prevPX)/dt;plrVz=(camera.position.z-prevPZ)/dt;}
  tickPlayerFootsteps(playerMoved,sprintingNow,onGnd);
  prevPX=camera.position.x;prevPZ=camera.position.z;

  // Only true automatic weapons repeat while fire is held.
  const fireW=getW();
  if(fireW.key==='rifle'){
    if(sCD>0)sCD-=dt;
    if(!(mouseDown||mobileInput.fire)||reloading||weaponActionBlocked())sCD=Math.max(0,sCD);
  }
  if((mouseDown||mobileInput.fire)&&fireW.automatic&&!reloading&&sCD<=0&&!weaponActionBlocked()){
    if(fireW.key==='rifle')shoot();
    else{autoFireT-=dt;if(autoFireT<=0){shoot();autoFireT=fireW.rate;}}
  } else {autoFireT=0;}

  // Gun
  const moving=_mv.length()>.1;
  const bob=moving?Math.sin(ts*.009)*.012:0;
  const bobSide=moving?Math.cos(ts*.0045)*.008:0;
  const recoilVis=FP_RECOIL_VISUAL[fireW.key]||FP_RECOIL_VISUAL.rifle;
  recoil*=Math.pow(.82,dt*60);
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
      // Legacy Pack 22 already contains its casing; Pack 32 deliberately uses the separate casing layer here.
      const fullBoltAction=cycleKind==='bolt'&&typeof isGeneratedFirstPersonActionActive==='function'&&isGeneratedFirstPersonActionActive('sniperBoltCycle');
      const fullShotgunPump=cycleKind==='pump'&&typeof isGeneratedFirstPersonActionActive==='function'&&isGeneratedFirstPersonActionActive('shotgunPump25');
      if(cycleKind==='pump'&&fpGeneratedWeaponActive&&shotgunPresentationAssetReady37('pack37ShotgunEffects')&&casings.length)casings[casings.length-1].m.visible=false;
      if(!fullBoltAction&&!fullShotgunPump){
        pendingGeneratedCycleCasing=cycleKind==='pump'?1:2;
      }
      cycleEjected=true;
    }
    const pumpZ=cycleKind==='pump'?cycleWave*.11:0;
    const boltX=cycleKind==='bolt'?cycleWave*.055:0;
    const cycleRot=cycleKind==='bolt'?cycleWave*.10:(cycleKind==='pump'?cycleWave*.055:0);
    gunGrp.position.set(adsX+bobSide*bobM-gunSwayX*swayM+boltX,adsY+bob*bobM-gunSwayY*swayM,adsZ+recoil*recoilVis.push+pumpZ);
    gunGrp.rotation.x=recoil*recoilVis.pitch+gunSwayY*.8*swayM+cycleRot;gunGrp.rotation.y=-gunSwayX*.9*swayM;gunGrp.rotation.z=bobSide*.8*bobM+recoil*recoilVis.roll+(cycleKind==='bolt'?cycleWave*.08:0);
  }
  if(beamM){if(beamT>0){beamT-=dt;beamM.material.opacity=(beamT/FP_MUZZLE_FLASH_SECONDS)*.72;if(flashM)flashM.material.opacity=beamT/FP_MUZZLE_FLASH_SECONDS;}else{beamM.material.opacity=0;if(flashM)flashM.material.opacity=0;}}
  if(typeof tickGeneratedFirstPersonAction==='function')tickGeneratedFirstPersonAction(dt);
  syncGeneratedFirstPersonWeaponArt(gunGrp.visible);
  // Emit and align screen-space shotgun FX only after the current pose/transform.
  if(pendingGeneratedCycleCasing===2&&typeof showGeneratedSniperCasingFx==='function')showGeneratedSniperCasingFx();
  else if(pendingGeneratedCycleCasing)showGeneratedCasingFx(pendingGeneratedCycleCasing===1);
  if(typeof syncGeneratedRifleEffectAnchors36==='function')syncGeneratedRifleEffectAnchors36();
  if(typeof syncGeneratedShotgunEffectAnchors38==='function')syncGeneratedShotgunEffectAnchors38();
  if(typeof syncGeneratedPistolEffectAnchors40==='function')syncGeneratedPistolEffectAnchors40();

  if(sCD>0&&fireW.key!=='rifle')sCD-=dt;
  tickFragGrenadeCharge(dt);
  tickPendingFragGrenadeThrow(dt);
  tickPendingMineThrow(dt);tickPendingSmokeThrow(dt);
  tickPendingBombPlant(dt);
  if(reloading){reloadT-=dt;if(reloadT<=0)completePlayerReloadStep();}
  updateWeaponStateHUD();
  ensureCurrentWeaponUsable();

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
    if(playerSmokeCD<=0&&getW().isSmoke)showMsg('🌫️ Кулдаун дымовухи завершён');
  }
  if(plr.regen>0){hp=Math.min(hp+plr.regen*dt,plr.maxHp);markHUD();}
  if(plr.armorRegen>0&&armor<plr.maxArmor){armor=Math.min(plr.maxArmor,armor+plr.armorRegen*dt);markHUD();}
  if(combo>0){comboT-=dt;if(comboT<=0)combo=0;}
  if(typeof syncComboMeterPresentation==='function')syncComboMeterPresentation();
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

  // Update bots unless the explicit testing freeze is enabled.
  let touched=false;
  if(!gameSettings.stopBots){
    for(const en of enemies){
      if(!en.alive)continue;
      const mel=en.update(dt);
      if(mel){let dmg=(9+en.type*2.8)*(1+level*.045+Math.min(.25,kills*.003))*dt;applyDamageToPlayer(dmg,'melee',en);touched=true;}
    }
  }
  if(touched)markHUD();

  tickFrontlineObjective(dt,ts);
  tickTacticalMinimap(dt,ts);
  flushHUD();
  tickProjectiles(dt);tickMines(dt);if(typeof syncExplosiveFuseArt==='function')syncExplosiveFuseArt();tickSmoke(dt);tickPickups(dt);
  tickParticles(dt);tickGibs(dt);tickCasings(dt);tickImpactMarks(dt);tickExpLights(dt);tickMzLights(dt);tickBombBlastWaves(dt);tickHeadshotFx(dt);tickExplosionFx(dt);tickCombatImpactFx(dt);tickEnvironment(dt);

  // Update ally panel
  updateAllyPanel(dt);

  if(!webglLost)renderFrame();
}

let allyPanelCd=0;
function allyCalloutKind(e){
  if(e.pickupTarget)return 'recover';
  if(e.reloadT>0)return 'reload';
  if(e.tacticalMode==='suppress')return 'suppress';
  if(e.role==='flankL'||e.role==='flankR')return 'flank';
  return 'cover';
}
function updateAllyPanel(dt){
  allyPanelCd-=dt;if(allyPanelCd>0)return;allyPanelCd=.20;
  const panel=G('ally-panel');
  const squad=enemies.filter(e=>e.alive&&e.team==='ally').sort((a,b)=>(b.kills||0)-(a.kills||0));
  const plan=refreshBotTeamTactics('ally');
  const zoneName=plan.zone?.label||'ЦЕНТР';
  const advantage=plan.aliveDelta>0?'+'+plan.aliveDelta:String(plan.aliveDelta||0);
  const order=`<div class="ally-icon ally-order" style="border-color:rgba(255,215,80,.58);background:rgba(38,30,4,.78);color:#ffe880;box-shadow:0 0 9px rgba(255,190,45,.18);"><span class="ally-doctrine-art" aria-hidden="true"></span><span>ПРИКАЗ: ${botDoctrineLabel(plan.doctrine)} · ${zoneName} · Δ ${advantage}</span></div>`;
  panel.innerHTML=order+squad.map((e,i)=>{
    const pct=Math.round(e.hp/e.maxHp*100);
    return `<div class="ally-icon" style="border-color:rgba(64,210,255,.72);background:rgba(0,48,96,.76);color:#b8f2ff;box-shadow:0 0 7px rgba(50,190,255,.25);"><span class="ally-role-art" data-role="${e.role}" aria-hidden="true"></span><span class="ally-callout-art" data-callout="${allyCalloutKind(e)}" aria-hidden="true"></span><span>СВОЙ ${i+1} · ${botRoleLabel(e.role)}: ${e.kills||0} ☠ · ${pct}%</span></div>`;
  }).join('');
  if(typeof applyPresentationAtlasFrame==='function'){
    applyPresentationAtlasFrame(panel.querySelector('.ally-doctrine-art'),botDoctrinePresentationFrame(plan.doctrine));
    panel.querySelectorAll('.ally-role-art').forEach(el=>applyPresentationAtlasFrame(el,botRolePresentationFrame(el.dataset.role)));
    panel.querySelectorAll('.ally-callout-art').forEach(el=>applyPresentationAtlasFrame(el,allyCalloutPresentationFrame(el.dataset.callout)));
  }
}
function syncGeneratedMobileControlArt(){
  const map=[['m-fire','fire'],['m-jump','jump'],['m-run','sprint'],['m-reload','reload'],['m-mine','mine'],['m-next','next']];
  for(const [id,kind] of map){
    const el=G(id);if(el&&applyPresentationAtlasFrame(el,mobileControlPresentationFrame(kind)))el.classList.add('generated-mobile-icon');
  }
}

// ─── BOOT ───────────────────────────────
setGameCursorHidden(false);
buildGun(getW());buildWeaponBar();bindMobileControls();syncGeneratedMobileControlArt();updateMineHUD();updateStats();updateTeamScore();ensureFrontlineMarker();updateFrontlineHUD(true);updateOrientationState();refreshMobileHUD();xpHUD();refreshStartButton();
requestAnimationFrame(loop);
preloadGameContent().then(()=>{
  document.documentElement.dataset.zapBoot='ready';
}).catch(err=>{
  console.error('ZAP ZONE boot failed',err);
  document.documentElement.dataset.zapBoot='failed';
});
