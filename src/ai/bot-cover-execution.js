function botCoverPeekEnvelope(peekT,peekDuration){
  if(peekDuration<=0)return 0;
  const p=Math.max(0,Math.min(1,1-peekT/peekDuration));
  return p<.24?p/.24:p>.72?(1-p)/.28:1;
}

function updateBotCoverSelection(bot,dt,targetPos,dist,hpPct){
  bot.coverEvalT-=dt;
  if(bot.coverEvalT<=0&&targetPos&&bot.coverCooldownT<=0){
    const needCover=(!bot.canSeeTarget&&dist>10)||(hpPct<0.52)||(bot.reloadT>0)||(bot.role==='anchor'&&dist>12)||(bot.lastDamageT>0&&dist>8)||(bot.suppressedT>0);
    const nextCover=needCover?findBotTacticalCover(bot,targetPos):null;
    if(nextCover&&(!bot.coverPoint||bot.coverPoint.distanceToSquared(nextCover)>.64))bot.coverHoldT=.28+Math.random()*.42;
    bot.coverPoint=nextCover;
    bot.coverEvalT=.82+Math.random()*.48;
  }
}

function tryStartBotCoverPeek(bot,targetPos){
  if(bot.peekPoint||bot.peekCooldownT>0||!targetPos||bot.reloadT>0||!bot.coverPoint)return false;
  const tx=targetPos.x-bot.coverPoint.x,tz=targetPos.z-bot.coverPoint.z,td=Math.max(.001,Math.hypot(tx,tz));
  const px=-tz/td,pz=tx/td;
  for(const sign of [bot.sideBias,-bot.sideBias]){
    const rawX=bot.coverPoint.x+px*sign*1.35,rawZ=bot.coverPoint.z+pz*sign*1.35;
    const coll=collideWalls(rawX,rawZ,BOT_R);
    if(Math.hypot(coll.x-rawX,coll.z-rawZ)>.55)continue;
    const eye=new THREE.Vector3(coll.x,1.38,coll.z),tgt=targetPos.clone();tgt.y+=1.15;
    if(!wallBetween(eye,tgt,losMeshes)&&!smokeBlocksSight(eye,tgt)){
      bot.peekPoint=new THREE.Vector3(coll.x,0,coll.z);bot.peekDuration=.92+Math.random()*.34;bot.peekT=bot.peekDuration;
      bot.peekCooldownT=1.25+Math.random()*.85;bot.sideBias=sign;return true;
    }
  }
  return false;
}

function runBotCoverExecution(bot,{dt,targetPos,dx,dz,squadPlan,assaultWaveState,mapObjective}){
  let mx=0,mz=0;
  if(!bot.coverPoint)return{x:mx,z:mz};
  tryStartBotCoverPeek(bot,targetPos);
  let coverGoal=bot.coverPoint,peekMoveM=.98;
  if(bot.peekPoint&&bot.peekT>0&&bot.peekDuration>0){
    coverGoal=bot.coverPoint.clone().lerp(bot.peekPoint,Math.max(0,botCoverPeekEnvelope(bot.peekT,bot.peekDuration)));
    peekMoveM=.68;
  }
  const cx=coverGoal.x-bot.group.position.x,cz=coverGoal.z-bot.group.position.z,cd=Math.sqrt(cx*cx+cz*cz)+0.001;
  if(cd>(bot.peekPoint?.42:1.4)){
    mx=(cx/cd)*bot.speed*peekMoveM;mz=(cz/cd)*bot.speed*peekMoveM;
  }else{
    bot.coverHoldT-=dt;
    if(bot.reloadT<=0&&bot.coverHoldT<=0){
      const canChain=(squadPlan.doctrine==='breach'||squadPlan.doctrine==='retake')&&assaultWaveState==='active'&&targetPos&&mapObjective&&bot.coverChainT<=0;
      const nextCover=canChain?findBotTacticalCover(bot,targetPos):null;
      const advances=nextCover&&nextCover.distanceToSquared(bot.group.position)>6.25&&
        nextCover.distanceTo(mapObjective)+1.2<bot.group.position.distanceTo(mapObjective);
      if(advances){
        bot.coverPoint=nextCover;bot.coverHoldT=.16+Math.random()*.22;bot.coverChainT=.72+Math.random()*.35;
      }else{
        bot.coverPoint=null;bot.coverCooldownT=.95+Math.random()*.70;
        bot.aiState=bot.canSeeTarget?'engage':'hunt';bot.stateCD=.32;
      }
    }
  }
  if(targetPos)bot.desiredYaw=Math.atan2(dx,dz);
  return{x:mx,z:mz};
}
