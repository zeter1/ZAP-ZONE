// Per-bot engage-state movement intent owner.
// Fire execution, weapon selection and final collision-limited locomotion stay in their dedicated owners.

function runBotEngagementMovement(bot,{
  dt,targetPos,dx,dz,dist,opponentWeapon,spd,myX,myZ,
  frontlineContested,frontlineBehind,squadPlan,mapObjective,objectiveDist
}){
  let mx=0,mz=0;
  if(!targetPos)return{x:mx,z:mz};

  bot.desiredYaw=Math.atan2(dx,dz);
  bot.strafeSwitchT-=dt;
  if(bot.strafeSwitchT<=0){
    bot.strafeDir*=-1;
    bot.strafeSwitchT=.55+Math.random()*.75;
  }

  const px=-dz/dist,pz=dx/dist;
  let optRange=bot.weapon.opt*(bot.role==='anchor'?1.24:bot.role==='assault'?0.78:1.0);
  if(bot.role==='engineer')optRange*=0.92;
  let strafeM=bot.tacticalMode==='suppress'?.48:.82;
  if(bot.tacticalMode==='suppress')optRange*=1.08;

  if(opponentWeapon){
    if(opponentWeapon.key==='shotgun')optRange=Math.max(optRange,18);
    else if(opponentWeapon.isRocket){
      optRange=Math.max(optRange,17);
      strafeM=1.02;
    }else if(opponentWeapon.isSniper){
      strafeM=1.08;
      if(bot.weapon.key==='shotgun'||bot.role==='assault')optRange=Math.min(optRange,21);
      else optRange=Math.max(optRange,30);
      bot.strafeSwitchT=Math.min(bot.strafeSwitchT,.48+Math.random()*.22);
    }
  }

  mx=px*bot.strafeDir*spd*strafeM;
  mz=pz*bot.strafeDir*spd*strafeM;

  const objectivePull=frontlineContested?.40:frontlineBehind?.31:(squadPlan.doctrine==='hold'?.46:0);
  if(objectivePull>0&&mapObjective&&objectiveDist>squadPlan.zoneRadius*.58){
    const ox=mapObjective.x-myX,oz=mapObjective.z-myZ,od=Math.max(.001,Math.hypot(ox,oz));
    mx+=(ox/od)*spd*objectivePull;
    mz+=(oz/od)*spd*objectivePull;
  }

  if(bot.role==='flankL'||bot.role==='flankR'){
    const sign=bot.role==='flankL'?-1:1;
    mx+=px*sign*spd*.24;
    mz+=pz*sign*spd*.24;
  }

  if(dist<optRange*.54){
    mx-=(dx/dist)*spd*.52*bot.bravery;
    mz-=(dz/dist)*spd*.52*bot.bravery;
  }else if(dist>bot.weapon.range*.82){
    mx+=(dx/dist)*spd*.70;
    mz+=(dz/dist)*spd*.70;
  }

  if(bot.role==='anchor'&&bot.coverPoint){
    const cdx=bot.coverPoint.x-myX,cdz=bot.coverPoint.z-myZ;
    mx+=cdx*.05;
    mz+=cdz*.05;
  }

  return{x:mx,z:mz};
}
