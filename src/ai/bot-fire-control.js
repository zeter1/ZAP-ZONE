// Per-bot fire-control execution owner.
// Squad doctrine/FSM/burst policy stay in src/entities/bots.js; projectile primitives stay in combat.js.

const _BOT_NEAR_MISS_TO_PLAYER=new THREE.Vector3(),_BOT_NEAR_MISS_POINT=new THREE.Vector3();

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
    return;
  }

  let dir=aim.clone().sub(from).normalize();
  const suppressing=bot.tacticalMode==='suppress'||suppressMemory;
  const incomingPressure=bot.suppressedT>0?1+Math.min(.48,bot.suppressedT*.20):1;
  const volumePenalty=suppressing?1.14:1;
  const acc=(wp.isRocket?(bot.curAcc*.50+wp.spread*.45):(bot.curAcc*.40+wp.spread*.78))*incomingPressure*volumePenalty;
  dir.x+=(Math.random()-.5)*acc;
  dir.y+=(Math.random()-.5)*acc*.28;
  dir.z+=(Math.random()-.5)*acc;
  dir.normalize();

  const shotCol=bot.team==='ally'?0x8cbcff:wp.bCol;
  if(friendlyInLine(from,dir,bot.team,Math.max(2,dist*.88))){
    bot.sT=.10+Math.random()*.12;
    return;
  }
  if(wp.isRocket&&(dist<10||friendlyNearPoint(aim,bot.team,5.2))){
    bot.weaponSwitchT=0;
    bot.sT=.18;
    return;
  }
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
    return;
  }

  const pellets=wp.pellets||1;
  let tracerDir=dir.clone();
  if(wp.hitscan){
    const distanceDamageScale=weaponDamageScaleAtDistance(wp,dist);
    const rangePenalty=dist/(wp.range*1.55);
    const targetVx=bot.targetEn&&bot.targetEn.alive?(bot.targetEn.velX||0):plrVx;
    const targetVz=bot.targetEn&&bot.targetEn.alive?(bot.targetEn.velZ||0):plrVz;
    const movingPenalty=(Math.abs(targetVx)+Math.abs(targetVz))*0.01;
    let hitChance=Math.max(.10,Math.min(.982,wp.hitBias-rangePenalty-Math.random()*bot.curAcc-movingPenalty));
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
}
