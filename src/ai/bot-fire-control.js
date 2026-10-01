// Per-bot fire-control execution owner.
// Squad doctrine/FSM/burst policy stay in src/entities/bots.js; projectile primitives stay in combat.js.

const _BOT_NEAR_MISS_TO_PLAYER=new THREE.Vector3(),_BOT_NEAR_MISS_POINT=new THREE.Vector3();

const BOT_FIRE_MOVE_ENTER_TAU=.10;
const BOT_FIRE_MOVE_RECOVER_TAU=.34;

const BOT_SHOT_OUTCOME=Object.freeze({
  EMITTED:'emitted',
  OCCLUDED:'blocked-occluded',
  FRIENDLY_FIRE:'blocked-friendly-fire',
  ROCKET_SAFETY:'blocked-rocket-safety'
});

const BOT_FIRE_RECOIL_PROFILES=Object.freeze({
  rifle:{kick:.18,max:.78,recoverTau:.30,spreadScale:.72,hitscanPenaltyScale:.055},
  plasma:{kick:.15,max:.68,recoverTau:.28,spreadScale:.64,hitscanPenaltyScale:.05},
  pistol:{kick:.08,max:.28,recoverTau:.22,spreadScale:.38,hitscanPenaltyScale:.035},
  shotgun:{kick:.10,max:.20,recoverTau:.32,spreadScale:.28,hitscanPenaltyScale:.03},
  sniper:{kick:.10,max:.16,recoverTau:.42,spreadScale:.22,hitscanPenaltyScale:.10},
  rocket:{kick:.08,max:.14,recoverTau:.44,spreadScale:.16,hitscanPenaltyScale:.025}
});
const BOT_FIRE_RECOIL_FALLBACK=Object.freeze({kick:.08,max:.30,recoverTau:.28,spreadScale:.40,hitscanPenaltyScale:.04});

function getBotMovementFireInstabilityTarget(bot){
  const vx=Number.isFinite(bot.velX)?bot.velX:0;
  const vz=Number.isFinite(bot.velZ)?bot.velZ:0;
  const speed=Math.hypot(vx,vz);
  const referenceSpeed=Math.max(1,Number.isFinite(bot.speed)?bot.speed:(Number.isFinite(bot.baseSpeed)?bot.baseSpeed:4));
  const speedNorm=Math.min(1.25,speed/referenceSpeed);
  const moving=Math.max(0,Math.min(1,(speedNorm-.08)/.92));
  if(moving<=0)return 0;

  const yaw=Number.isFinite(bot.group?.rotation?.y)?bot.group.rotation.y:0;
  const lateralSpeed=Math.abs(vx*Math.cos(yaw)-vz*Math.sin(yaw));
  const lateralRatio=Math.max(0,Math.min(1,lateralSpeed/Math.max(speed,.001)));
  return Math.min(1,moving*(.58+.42*lateralRatio));
}

function updateBotFireMovementStability(bot,dt){
  const target=getBotMovementFireInstabilityTarget(bot);
  const current=Math.max(0,Math.min(1,Number.isFinite(bot.fireMoveInstability)?bot.fireMoveInstability:0));
  const tau=target>current?BOT_FIRE_MOVE_ENTER_TAU:BOT_FIRE_MOVE_RECOVER_TAU;
  const alpha=1-Math.exp(-Math.max(0,dt)/tau);
  const next=current+(target-current)*alpha;
  bot.fireMoveInstability=next<.001?0:Math.max(0,Math.min(1,next));
  return bot.fireMoveInstability;
}

function getBotFireRecoilProfile(wp){
  return BOT_FIRE_RECOIL_PROFILES[wp?.key]||BOT_FIRE_RECOIL_FALLBACK;
}

function syncBotFireRecoilWeapon(bot,wp=bot.weapon){
  const weaponKey=wp?.key||'';
  if(bot.fireRecoilWeaponKey!==weaponKey){
    bot.fireRecoilWeaponKey=weaponKey;
    bot.fireBurstRecoil=0;
  }
  return getBotFireRecoilProfile(wp);
}

function updateBotFireRecoilRecovery(bot,dt){
  const profile=syncBotFireRecoilWeapon(bot);
  const current=Math.max(0,Math.min(profile.max,Number.isFinite(bot.fireBurstRecoil)?bot.fireBurstRecoil:0));
  if(current<=0){
    bot.fireBurstRecoil=0;
    return 0;
  }
  const next=current*Math.exp(-Math.max(0,dt)/profile.recoverTau);
  bot.fireBurstRecoil=next<.001?0:next;
  return bot.fireBurstRecoil;
}

function registerBotEmittedShotRecoil(bot,wp=bot.weapon){
  const profile=syncBotFireRecoilWeapon(bot,wp);
  const current=Math.max(0,Math.min(profile.max,Number.isFinite(bot.fireBurstRecoil)?bot.fireBurstRecoil:0));
  bot.fireBurstRecoil=Math.min(profile.max,current+profile.kick);
  return bot.fireBurstRecoil;
}

function getBotShotStabilityModifiers(bot,wp,suppressing=false){
  const movement=Math.max(0,Math.min(1,Number.isFinite(bot.fireMoveInstability)?bot.fireMoveInstability:0));
  const recoilProfile=syncBotFireRecoilWeapon(bot,wp);
  const recoil=Math.max(0,Math.min(recoilProfile.max,Number.isFinite(bot.fireBurstRecoil)?bot.fireBurstRecoil:0));
  const incomingPressure=bot.suppressedT>0?1+Math.min(.48,bot.suppressedT*.20):1;
  const volumePenalty=suppressing?1.14:1;
  const movementSpreadScale=wp.isSniper?.92:wp.isRocket?.42:wp.key==='shotgun'?.34:wp.key==='plasma'?.56:.64;
  const movementHitscanPenalty=wp.hitscan?movement*(wp.isSniper?.16:wp.key==='pistol'?.075:.10):0;
  const recoilHitscanPenalty=wp.hitscan?recoil*recoilProfile.hitscanPenaltyScale:0;
  return{
    movement,
    recoil,
    spreadMultiplier:incomingPressure*volumePenalty*(1+movement*movementSpreadScale+recoil*recoilProfile.spreadScale),
    hitscanPenalty:movementHitscanPenalty+recoilHitscanPenalty
  };
}

function botShotClosestApproachToPlayer(from,dir,maxRange=120){
  const torso=_BOT_NEAR_MISS_TO_PLAYER.set(camera.position.x,camera.position.y-.28,camera.position.z);
  const rel=torso.clone().sub(from);
  const along=Math.max(0,Math.min(maxRange,rel.dot(dir)));
  if(along<1.2)return null;
  _BOT_NEAR_MISS_POINT.copy(from).addScaledVector(dir,along);
  if(wallBetween(from,_BOT_NEAR_MISS_POINT,wallMeshes))return null;
  const distance=_BOT_NEAR_MISS_POINT.distanceTo(torso);
  return{distance,along,point:_BOT_NEAR_MISS_POINT.clone()};
}

function getBotAimPoint(bot,tp){
  const aim=tp.clone();
  if(bot.targetEn&&bot.targetEn.alive)aim.y+=1.26;
  else aim.y=camera.position.y-.10;
  const dist=Math.max(1,bot.group.position.distanceTo(tp));
  let lead=0;
  if(bot.weapon.isRocket)lead=Math.min(1.05,dist/BOT_ROCKET_SPEED)*(.72+bot.aimSkill*.20);
  else if(bot.weapon.key==='plasma')lead=Math.min(.42,dist/TRACER_SPEED.plasma)*.45;
  const vx=bot.targetEn&&bot.targetEn.alive?(bot.targetEn.velX||0):plrVx;
  const vz=bot.targetEn&&bot.targetEn.alive?(bot.targetEn.velZ||0):plrVz;
  aim.x+=vx*lead;aim.z+=vz*lead;
  const smooth=.16+bot.aimSkill*.18;
  if(!Number.isFinite(bot.aimPoint.x))bot.aimPoint.copy(aim);
  bot.aimPoint.lerp(aim,smooth);
  return bot.aimPoint.clone();
}

function getBotMuzzlePos(bot){
  const fwd=new THREE.Vector3(Math.sin(bot.group.rotation.y),0,Math.cos(bot.group.rotation.y));
  const mp=bot.group.position.clone();
  mp.y+=1.22;
  mp.addScaledVector(fwd,.96);
  return mp;
}

function startBotReload(bot){
  if(bot.reloadT<=0){
    bot.reloadT=bot.weapon.reload*(0.86+Math.random()*.18);
    playWeaponMechanicSound('reload',.32,bot.weapon.key,bot.group.position);
    if(typeof showGeneratedBotReloadVfx==='function')showGeneratedBotReloadVfx(bot);
  }
}

function finishBotReload(bot){
  bot.mag=bot.weapon.clip;bot.reloadT=0;
  playWeaponMechanicSound('reloadDone',.24,bot.weapon.key,bot.group.position);
}

function dealBotDamageToCurrentTarget(bot,amount,dir){
  if(amount<=0)return;
  if(bot.targetEn&&bot.targetEn.alive&&bot.targetEn.team!==bot.team){
    bot.targetEn.hurt(amount,dir,bot.team,bot);
    if(!bot.targetEn.alive){
      bot.kills=(bot.kills||0)+1;
      if(bot.team==='ally')allyKills++;else enemyKills++;
      updateTeamScore();
      if(typeof pushKillFeed==='function'){
        pushKillFeed(
          bot.team,
          bot.team==='ally'?'СВОЙ БОТ':'ВРАЖЕСКИЙ БОТ',
          bot.targetEn.team,
          bot.targetEn.team==='ally'?'СВОЙ БОТ':'ВРАЖЕСКИЙ БОТ',
          'bullet'
        );
      }
    }
    return;
  }
  if(bot.team==='enemy'&&bot.targetIsPlayer)applyDamageToPlayer(amount*ENEMY_VS_PLAYER_DAMAGE_SCALE,'bullet',bot);
}

function executeBotShot(bot,tp,dist,suppressMemory=false){
  const wp=bot.weapon;
  const from=getBotMuzzlePos(bot);
  const aim=getBotAimPoint(bot,tp);
  const wallBlocked=wallBetween(from,aim,losMeshes),smokeBlocked=smokeBlocksSight(from,aim);
  if(wallBlocked||(smokeBlocked&&!suppressMemory)){
    if(Math.random()<.20){
      const missDir=aim.clone().sub(from).normalize();
      const missCol=bot.team==='ally'?0x8cbcff:wp.bCol;
      if(wp.hitscan)spawnInstantSniperTrace(from,missDir,Math.min(dist,18),missCol);
      else spawnTracer(from,missDir,Math.min(dist,18),missCol,wp.key);
    }
    return BOT_SHOT_OUTCOME.OCCLUDED;
  }

  let dir=aim.clone().sub(from).normalize();
  const suppressing=bot.tacticalMode==='suppress'||suppressMemory;
  const stability=getBotShotStabilityModifiers(bot,wp,suppressing);
  const acc=(wp.isRocket?(bot.curAcc*.50+wp.spread*.45):(bot.curAcc*.40+wp.spread*.78))*stability.spreadMultiplier;
  dir.x+=(Math.random()-.5)*acc;
  dir.y+=(Math.random()-.5)*acc*.28;
  dir.z+=(Math.random()-.5)*acc;
  dir.normalize();

  const shotCol=bot.team==='ally'?0x8cbcff:wp.bCol;
  if(friendlyInLine(from,dir,bot.team,Math.max(2,dist*.88))){
    return BOT_SHOT_OUTCOME.FRIENDLY_FIRE;
  }
  if(wp.isRocket&&(dist<10||friendlyNearPoint(aim,bot.team,5.2))){
    bot.weaponSwitchT=0;
    return BOT_SHOT_OUTCOME.ROCKET_SAFETY;
  }

  // Recoil is an emitted-shot fact, not an attempted-shot fact. Keep it after
  // LOS/friendly-fire/rocket-safety gates so blocked attempts cannot fake bloom.
  registerBotEmittedShotRecoil(bot,wp);
  emitBotCombatNoise(from,bot,wp,wp.isRocket?'rocket':'shot');
  playWeaponShotSound(wp.key,bot.team==='enemy'?1:.72,from);
  trigMuzzle(from,shotCol,wp.isRocket?1.45:wp.isSniper?1.38:wp.key==='shotgun'?1.2:1);
  showGeneratedBotMuzzleVfx(from,bot);
  if(wp.key!=='rocket'&&wp.key!=='plasma'){
    const q=new THREE.Quaternion().setFromAxisAngle(_UP,bot.group.rotation.y);
    ejectCasing(from.clone().add(new THREE.Vector3(0,.08,0)),q,wp.key==='shotgun');
  }

  if(wp.isRocket){
    spawnERkt(from,dir,wp.dmg*BOT_DAMAGE_BOOST*EXPLOSION_DAMAGE_BOOST*bot.baseDmgMul,bot.team,bot);
    bot.mag--;
    return BOT_SHOT_OUTCOME.EMITTED;
  }

  const pellets=wp.pellets||1;
  let tracerDir=dir.clone();
  if(wp.hitscan){
    const distanceDamageScale=weaponDamageScaleAtDistance(wp,dist);
    const rangePenalty=dist/(wp.range*1.55);
    const targetVx=bot.targetEn&&bot.targetEn.alive?(bot.targetEn.velX||0):plrVx;
    const targetVz=bot.targetEn&&bot.targetEn.alive?(bot.targetEn.velZ||0):plrVz;
    const movingPenalty=(Math.abs(targetVx)+Math.abs(targetVz))*0.01;
    let hitChance=Math.max(.10,Math.min(.982,wp.hitBias-rangePenalty-Math.random()*bot.curAcc-movingPenalty-stability.hitscanPenalty));
    if(suppressing)hitChance*=.80;
    if(bot.suppressedT>0)hitChance*=Math.max(.72,1-Math.min(.24,bot.suppressedT*.10));
    let totalDmg=0;
    if(bot.targetEn&&bot.targetEn.alive){
      if(Math.random()<hitChance)totalDmg=wp.dmg*distanceDamageScale*BOT_DAMAGE_BOOST*bot.baseDmgMul;
    }else if(bot.team==='enemy'){
      const toPlr=new THREE.Vector3(camera.position.x-from.x,camera.position.y-from.y,camera.position.z-from.z).normalize();
      const align=dir.dot(toPlr);
      hitChance*=.72;
      if(Math.random()<hitChance&&align>.958)totalDmg=wp.dmg*distanceDamageScale*BOT_DAMAGE_BOOST*bot.baseDmgMul*.88;
    }
    if(bot.team==='enemy'&&bot.targetIsPlayer&&totalDmg<=0&&dist>5&&(bot.nearMissCd||0)<=0){
      const approach=botShotClosestApproachToPlayer(from,tracerDir,Math.max(6,Math.min(wp.range+10,dist+18)));
      if(approach&&approach.distance<=1.78){
        const pressure=registerPlayerSuppression(bot,wp,approach.point,approach.distance,1.78);
        if(pressure>0)bot.nearMissCd=Math.max(.16,.38-pressure*.11);
      }
    }
    spawnInstantSniperTrace(from,tracerDir,Math.min(dist,wp.range+10),shotCol);
    if(totalDmg>0)dealBotDamageToCurrentTarget(bot,totalDmg,tracerDir);
  }else{
    const baseDamage=wp.dmg*BOT_DAMAGE_BOOST*bot.baseDmgMul;
    for(let i=0;i<pellets;i++){
      const pd=dir.clone();
      if(pellets>1){
        const pe=wp.spread*(0.65+dist/Math.max(10,wp.range)*0.75);
        pd.x+=(Math.random()-.5)*pe;
        pd.y+=(Math.random()-.5)*pe*.34;
        pd.z+=(Math.random()-.5)*pe;
        pd.normalize();
      }
      if(i===0)tracerDir.copy(pd);
      const pelletDamage=baseDamage*(pellets>1?.58:1);
      const playerDamage=pelletDamage*ENEMY_VS_PLAYER_DAMAGE_SCALE*(pellets>1?.79:.88);
      spawnEnemyBullet(from,pd,wp,bot,{
        visual:i===0,damage:pelletDamage,playerDamage,
        suppressing
      });
    }
  }
  bot.mag--;
  return BOT_SHOT_OUTCOME.EMITTED;
}
