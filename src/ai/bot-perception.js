'use strict';

// Canonical owner for individual-bot sensing and target acquisition.
// FSM decisions and combat execution remain in src/entities/bots.js.

function nearestHostileGrenade(bot,maxDist=10){
  let best=null,bestScore=Infinity;
  for(const g of botGrenades){
    if(!g?.m||g.team===bot.team||g.fuse<=0)continue;
    const d=bot.group.position.distanceTo(g.m.position);
    if(d>maxDist)continue;
    const score=d+Math.max(0,g.fuse-.75)*3.2;
    if(score<bestScore){bestScore=score;best={grenade:g,distance:d};}
  }
  return best;
}

const BOT_NOISE_EVENTS=[];
let botLastPlayerShotSequence=0;
function botWeaponNoiseRadius(w){
  if(!w)return 30;
  if(w.isRocket)return 62;
  if(w.isSniper)return 72;
  if(w.key==='shotgun')return 48;
  if(w.key==='rifle')return 46;
  if(w.key==='plasma')return 39;
  return 32;
}
function botSourceTeam(source){return source==='player'?'ally':(source?.team||null);}
function emitBotCombatNoise(pos,source,w,kind='shot'){
  BOT_NOISE_EVENTS.push({pos:pos.clone(),source,kind,time:performance.now(),radius:botWeaponNoiseRadius(w),strength:w?.isRocket?1.28:w?.isSniper?1.18:w?.key==='shotgun'?1.08:1});
  if(BOT_NOISE_EVENTS.length>36)BOT_NOISE_EVENTS.splice(0,BOT_NOISE_EVENTS.length-36);
}
function syncPlayerCombatNoise(){
  if(shotSequence===0){botLastPlayerShotSequence=0;return;}
  if(shotResetT>0&&shotSequence!==botLastPlayerShotSequence){
    emitBotCombatNoise(camera.position,'player',getW(),'shot');
    botLastPlayerShotSequence=shotSequence;
  }
}

function botCanSeePoint(bot,pos,yOffset=1.25){
  const eye=bot.group.position.clone();eye.y+=1.48;
  const target=pos.clone();target.y+=yOffset;
  return !wallBetween(eye,target,losMeshes)&&!smokeBlocksSight(eye,target);
}

function updateBotHearingPerception(bot,dt){
  if(bot.heardT>0)bot.heardT=Math.max(0,bot.heardT-dt);
  bot.hearingScanT-=dt;
  if(bot.hearingScanT>0)return false;
  bot.hearingScanT=.10+Math.random()*.07;
  const now=performance.now();
  while(BOT_NOISE_EVENTS.length&&now-BOT_NOISE_EVENTS[0].time>2200)BOT_NOISE_EVENTS.shift();
  let best=null,bestScore=-Infinity,bestDist=0,bestRadius=0;
  const ear=bot.group.position.clone();ear.y+=1.35;
  for(let idx=BOT_NOISE_EVENTS.length-1;idx>=0;idx--){
    const ev=BOT_NOISE_EVENTS[idx];
    if(ev.source===bot||botSourceTeam(ev.source)===bot.team)continue;
    if(ev.source!=='player'&&(!ev.source||!ev.source.alive))continue;
    const age=(now-ev.time)/1000;if(age>1.75)continue;
    const d=bot.group.position.distanceTo(ev.pos);
    let radius=ev.radius;
    const snd=ev.pos.clone();snd.y=Math.max(.8,snd.y);
    if(wallBetween(ear,snd,losMeshes))radius*=.52;
    if(d>radius)continue;
    const score=(1-d/radius)*ev.strength-age*.20;
    if(score>bestScore){best=ev;bestScore=score;bestDist=d;bestRadius=radius;}
  }
  if(!best)return false;
  const uncertainty=Math.min(4.2,(bestDist/Math.max(1,bestRadius))*3.6)*(1-bot.aimSkill*.38);
  const ang=Math.random()*Math.PI*2;
  bot.heardPos.copy(best.pos);
  bot.heardPos.x+=Math.cos(ang)*uncertainty;bot.heardPos.z+=Math.sin(ang)*uncertainty;
  bot.heardSource=best.source;bot.heardIsPlayer=best.source==='player';bot.heardT=1.65;
  const currentRecent=bot.canSeeTarget&&bot.lastSeenT<.45;
  const sameCurrent=bot.heardIsPlayer?bot.targetIsPlayer:bot.targetEn===best.source;
  if(!currentRecent||sameCurrent){
    bot.lastKnown.copy(bot.heardPos);bot.lastKnownVel.set(0,0,0);
    bot.lastSeenT=Math.min(bot.lastSeenT,1.10);bot.searchPoint=null;bot.searchStep=0;
    if(!sameCurrent&&bot.targetLockT<=.18){
      if(bot.heardIsPlayer&&bot.team==='enemy'&&!dying){bot.targetEn=null;bot.targetIsPlayer=true;}
      else if(best.source&&best.source.alive&&best.source.team!==bot.team){bot.targetEn=best.source;bot.targetIsPlayer=false;}
      bot.canSeeTarget=false;bot.losT=0;bot.targetLockT=.36+bot.aimSkill*.30;
    }
    return true;
  }
  return false;
}

function updateBotTargetPerception(bot){
  bot.targetScanT-=bot._lastDt||.016;
  const mx=bot.group.position.x,mz=bot.group.position.z;
  const currentValid=(bot.targetEn&&bot.targetEn.alive&&bot.targetEn.team!==bot.team)||(bot.targetIsPlayer&&bot.team==='enemy'&&!dying);
  if(currentValid&&(bot.targetScanT>0||bot.targetLockT>0)){
    const tp=bot.targetEn&&bot.targetEn.alive?bot.targetEn.group.position:camera.position;
    return Math.hypot(tp.x-mx,tp.z-mz);
  }
  const prev=bot.targetEn,prevPlayer=bot.targetIsPlayer;
  let bestScore=Infinity,bestE=null,bestPlayer=false,currentScore=Infinity;
  for(const other of enemies){
    if(!other.alive||other===bot||other.team===bot.team)continue;
    const dx=other.group.position.x-mx,dz=other.group.position.z-mz,d=Math.hypot(dx,dz);
    const visible=d<72&&botCanSeePoint(bot,other.group.position,1.24);
    const heard=bot.heardT>0&&!bot.heardIsPlayer&&bot.heardSource===other;
    const memory=other===prev&&bot.lastSeenT<8.5;
    if(!visible&&!heard&&!memory&&d>34)continue;
    const wounded=(1-other.hp/other.maxHp)*3.8;
    const crowdPenalty=Math.max(0,countTargeters(other,bot.team)-1)*2.7;
    const roleBias=other.role==='anchor'?-1.2:other.role==='engineer'?-1.8:0;
    const threatBias=(other.kills||0)*-.16;
    const perceptionBias=visible?-7.0:heard?-3.1:memory?0:(6+d*.08);
    const score=d-wounded+crowdPenalty+roleBias+threatBias+perceptionBias;
    if(other===prev)currentScore=score;
    if(score<bestScore){bestScore=score;bestE=other;bestPlayer=false;}
  }
  if(bot.team==='enemy'&&!dying){
    const d=Math.hypot(camera.position.x-mx,camera.position.z-mz);
    const visible=d<76&&botCanSeePoint(bot,camera.position,0);
    const heard=bot.heardT>0&&bot.heardIsPlayer;
    const memory=prevPlayer&&bot.lastSeenT<8.5;
    if(visible||heard||memory||d<=36){
      const playerThreat=Math.min(10,kills*.09+level*.22);
      const focused=countPlayerTargeters(bot.team,bot);
      const crowdPenalty=focused>=2?8+(focused-2)*5:focused*1.8;
      const perceptionBias=visible?-7.5:heard?-3.4:memory?0:(7+d*.09);
      const score=d-1.2-playerThreat+crowdPenalty+perceptionBias;
      if(prevPlayer)currentScore=score;
      if(score<bestScore){bestScore=score;bestE=null;bestPlayer=true;}
    }
  }
  if(currentValid&&currentScore<Infinity){
    const switchMargin=2.8+bot.aimSkill*3.2;
    if(currentScore<=bestScore+switchMargin){bestE=prevPlayer?null:prev;bestPlayer=prevPlayer;}
  }
  bot.targetEn=bestE;bot.targetIsPlayer=bestPlayer;
  bot.targetScanT=.15+(1-bot.aimSkill)*.16+Math.random()*.10;
  if(prev!==bestE||prevPlayer!==bestPlayer){
    const heardSwitch=bot.heardT>0&&(bestPlayer?bot.heardIsPlayer:(!bot.heardIsPlayer&&bot.heardSource===bestE));
    bot.targetLockT=(heardSwitch?.46:.72)+bot.aimSkill*.48+Math.random()*.20;
    bot.reactionT=.11+(1-bot.aimSkill)*.48+Math.random()*.13;
    bot.burstPauseT=Math.max(bot.burstPauseT,.08);bot.canSeeTarget=false;bot.losT=0;
    if(heardSwitch){bot.lastKnown.copy(bot.heardPos);bot.lastSeenT=Math.min(bot.lastSeenT,1.05);}
    else{bot.lastSeenT=999;bot.lastKnownVel.set(0,0,0);}
    bot.searchPoint=null;bot.searchStep=0;
  }
  if(bestE)return Math.hypot(bestE.group.position.x-mx,bestE.group.position.z-mz);
  if(bestPlayer)return Math.hypot(camera.position.x-mx,camera.position.z-mz);
  return 999;
}

function botTargetPosition(bot){
  if(bot.targetEn&&bot.targetEn.alive)return bot.targetEn.group.position;
  if(bot.targetIsPlayer&&!dying)return camera.position;
  return null;
}

function updateBotMineThreat(bot,dt){
  bot.mineScanT-=dt;
  if(bot.mineScanT<=0){
    bot.mineScanT=.16+Math.random()*.12;
    bot.cachedMineThreat=nearestHostileMine(bot.group.position,bot.team,bot.role==='engineer'?18:20,bot);
  }
  return bot.cachedMineThreat&&!bot.cachedMineThreat.mine.removed?bot.cachedMineThreat:null;
}

function updateBotGrenadeThreat(bot,dt){
  bot.grenadeScanT-=dt;
  if(bot.grenadeScanT<=0){
    bot.grenadeScanT=.10+Math.random()*.08;
    bot.cachedGrenadeThreat=nearestHostileGrenade(bot,bot.role==='assault'?9:11);
  }
  return bot.cachedGrenadeThreat&&bot.cachedGrenadeThreat.grenade?.fuse>0?bot.cachedGrenadeThreat:null;
}

function updateBotLineOfSight(bot,targetPos,dt){
  bot.losT-=dt;
  if(bot.losT<=0&&targetPos){
    bot.losT=bot.team==='ally' ? (.16+Math.random()*.09) : (.22+Math.random()*.12);
    const eye=bot.group.position.clone();eye.y+=1.48;
    const th=targetPos.clone();th.y+=(bot.targetEn&&bot.targetEn.alive)?1.24:0;
    const sawBefore=bot.canSeeTarget;
    bot.canSeeTarget=!wallBetween(eye,th,losMeshes)&&!smokeBlocksSight(eye,th);
    if(bot.canSeeTarget){
      const targetVx=bot.targetEn&&bot.targetEn.alive?(bot.targetEn.velX||0):plrVx;
      const targetVz=bot.targetEn&&bot.targetEn.alive?(bot.targetEn.velZ||0):plrVz;
      bot.lastKnownVel.x+=(targetVx-bot.lastKnownVel.x)*.55;
      bot.lastKnownVel.z+=(targetVz-bot.lastKnownVel.z)*.55;
      bot.lastKnown.copy(targetPos);bot.lastSeenT=0;bot.lastTargetSeenAt=performance.now();
      bot.searchPoint=null;bot.searchStep=0;
      TEAM_INTEL[bot.team].pos.copy(targetPos);TEAM_INTEL[bot.team].time=performance.now();TEAM_INTEL[bot.team].target=bot.targetEn||'player';
      if(!sawBefore)bot.reactionT=Math.max(bot.reactionT,.12+(1-bot.aimSkill)*.32);
    }
  }
  bot.lastSeenT+=dt;
}

function findBotIncomingRocketThreat(bot){
  let best=null,bestScore=Infinity;
  for(const arr of [pRkts,eRkts]){
    for(const rk of arr){
      if(!rk?.m||rk._src===bot)continue;
      const rocketTeam=rk.ownerType==='player'?'ally':(rk._src?.team||rk.team||null);
      if(rocketTeam===bot.team)continue;
      const rx=rk.m.position.x-bot.group.position.x,rz=rk.m.position.z-bot.group.position.z;
      const vx=rk.vx||0,vz=rk.vz||0,speed2=vx*vx+vz*vz;
      if(speed2<1)continue;
      const t=Math.max(0,Math.min(1.35,-(rx*vx+rz*vz)/speed2));
      const cx=rx+vx*t,cz=rz+vz*t,miss=Math.hypot(cx,cz);
      const danger=(rk.blastRadius||6.2)+2.0;
      if(t<=0||miss>danger)continue;
      const score=miss+t*3.4;
      if(score<bestScore){bestScore=score;best={rocket:rk,time:t,miss,side:(vx*rz-vz*rx)>=0?1:-1};}
    }
  }
  return best;
}

function updateBotRocketThreat(bot,dt){
  bot.rocketCheckT-=dt;
  if(bot.rocketCheckT>0)return null;
  bot.rocketCheckT=.12+Math.random()*.06;
  bot.cachedRocketThreat=findBotIncomingRocketThreat(bot);
  return bot.cachedRocketThreat;
}
